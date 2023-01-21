const express = require('express');
require('dotenv').config();
const PORT = process.env.PORT;
const app = express();
const connectDB = require('./config/db');
const cors = require('cors');
const User = require('./models/user.model');
const jwt = require('jsonwebtoken');


app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cors());

app.get('/', async (req, res) => {
    const users = await User.find();
    return res.status(200).send({users});
});

app.post('/register', async (req, res) => {
    try {
        const {name, email, password} = req.body;
        const user = await User.findOne({email});
        if(user) return res.status(400).send({message : 'Email already exists please login'});
        
        await User.create({
            name,
            email,
            password 
        })

        return res.status(200).send({message : 'User created successfully'});
        
    } catch (error) {
        return res.status(400).send({error});
    }
});

app.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(user) {
         if(user.password !== password) {
                return res.status(400).send({message : 'Invalid password'});
         }else{
                const token = jwt.sign({id : user._id,
                name : user.name,
                email : user.email
                
                }, process.env.JWT_SECRET, {expiresIn : '7d'});
                return res.status(200).send({
                    message : 'Login successfully',
                    token});
         }
        }else{
            return res.status(400).send({message : 'Email does not exist please register'});
        }


      
        
    } catch (error) {
        return res.status(400).send({message : 'Something went wrong'});
    }
});

app.post('/getProfile', async (req, res) => {
    try {
        const {token} = req.headers;
        if(!token) return res.status(401).send({message : 'Token not found not authorized'});
        const user = await jwt.verify(token, process.env.JWT_SECRET);
        
        const details=await User.findOne({_id:user.id}).select('-password')
        return res.status(200).send({user:details
        });

      
        
    } catch (error) {
        return res.status(400).send({message : error.message});
 
    }
});
app.post('/calculate', async (req, res) => {
    try {
        const {token} = req.headers;
        if(!token) return res.status(401).send({message : 'Token not found not authorized'});
        const user = await jwt.verify(token, process.env.JWT_SECRET);

        if(user){

            const {installment,interest,years}=req.body;
            
            let MaturityValue =+(installment * ((Math.pow((1 + interest / 100), years)-1)/(interest/100))).toFixed(2);
            console.log('MaturityValue: ', MaturityValue);
            
            let InvestmentAmount=+installment*years;
            console.log('InvestmentAmount: ', InvestmentAmount);
            
            let TotalInterest=+(MaturityValue-InvestmentAmount).toFixed(2);
            console.log('totalInterest: ', TotalInterest);
            
            return res.status(200).send({MaturityValue,InvestmentAmount,TotalInterest});
        }
        
    } catch (error) {
        return res.status(400).send({message : error.message});
 
    }
});


app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server http://localhost:${PORT} `);
});


