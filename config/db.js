const mongoose = require('mongoose')
require('dotenv').config()

const connectDB= async() => {
    try {
        await mongoose.connect(process.env.DB_MONGO)
        console.log('DB connected')
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

module.exports = connectDB