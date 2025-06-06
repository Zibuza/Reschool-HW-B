

const { default: mongoose } = require("mongoose")
require('dotenv').config()

const connectToDb = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log('connected successfully')

    }catch(e){
        console.log("ver daukavshirda mongodbs")    
    }
}


module.exports = connectToDb