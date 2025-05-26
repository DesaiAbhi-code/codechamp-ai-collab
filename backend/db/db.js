import mongoose from "mongoose";


const connect = async ()=>{
    await mongoose.connect(process.env.MONGO_URL)
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("mongooes is connect")
    }catch(Error){
        console.log(Error);
        
    }

}

export default connect;