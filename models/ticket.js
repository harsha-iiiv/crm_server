const mongoose = require('mongoose');


const Ticketschema = new mongoose.Schema({ 
    
    from : { type: String},
    to: { type: String},
    subject: { type: String},
    message: { type: String},
    status: { type: String, default: 'open'},
   
},
{
    timestamps: true 
});

module.exports = mongoose.model('Tickets', Ticketschema); 