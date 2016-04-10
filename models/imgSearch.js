var mongoose=require('mongoose');
var Schema=mongoose.Schema;
var imgSearchSchema=new Schema({
	term:String,
	when:String,
	ip:String
})
mongoose.model('imgSearch',imgSearchSchema);
