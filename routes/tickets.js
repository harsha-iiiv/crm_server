const express = require("express");
const router = express.Router();
const ticket = require("../models/ticket");
var imaps = require("imap-simple");

var dateFormat = require("dateformat");
const simpleParser = require("mailparser").simpleParser;
const nodemailer = require("nodemailer");

const _ = require("lodash");
var email = [];
var date = "2020-02-19T16:42:18.000Z";
require("dotenv").config();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
console.log(process.env.EMAIL_ADDRESS);
var config = {
  imap: {
    user: "process.env.EMAIL_ADDRESS",
    password: "process.env.EMAIL_PASSWORD",
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 3000
  }
};

// GET all tickets from mail
router.get("/", async (req, res) => {
  try {
    await imaps.connect(config).then(function(connection) {
      return connection.openBox("INBOX").then(function() {
        var searchCriteria = [
          "UNSEEN",
          ["SINCE", dateFormat(date, "mmmm d, yyyy")]
        ];
        var fetchOptions = {
          bodies: ["HEADER", "TEXT", ""]
        };
        return connection
          .search(searchCriteria, fetchOptions)
          .then(function(messages) {
            messages.forEach(function(item) {
              var all = _.find(item.parts, { which: "" });
              var id = item.attributes.uid;
              var idHeader = "Imap-Id: " + id + "\r\n";
              simpleParser(idHeader + all.body, (err, mail) => {
                // access to the whole mail object

                date = mail.date;
                const Ticket = new ticket({
                  from: mail.headers.get("return-path").text,
                  to: mail.headers.get("delivered-to").text,
                  subject: mail.subject,
                  message: mail.text
                });

                Ticket.save();

                email.push({
                  from: mail.headers.get("return-path").text,
                  to: mail.headers.get("delivered-to").text,
                  subject: mail.subject,
                  message: mail.text
                });
              });
            });
            ticket.find().then(alltickets => {
              res.json(alltickets);
            });
          });
      });
    });
  } catch (error) {
    res.status(404).json({ msg: "Sorry unable fetch mail" });
  }
});

router.get("/:ticketNo", async (req, res) => {
  try {
    const displayTicket = await ticket.findById(req.params.ticketNo);
    res.send(displayTicket);
  } catch (error) {
    res.json({ message: error });
  }
});

//Comment on user mail list

router.post("/:ticketNo/comment", async (req, res) => {
  console.error(req.params.ticketNo);
  const displayTicket = await ticket.findById(req.params.ticketNo);

  if (!displayTicket)
    return res.status(400).json({ errors: [{ msg: "Ticket not exists" }] });
  var emails = [];

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,

      secure: false,
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log("sending mail");

    const mailOptions = {
      from: "cem.iiitv@gmail.com",

      subject: `ticket#${displayTicket._id}`,
      text:
        "You are receiving this because you (or someone else) have created ticket"
    };
    mailOptions.to = displayTicket.from;
    transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        console.error("there was an error: ", err);
      } else {
        console.log("here is the res: ", response);
        res.status(200).json("recovery email sent");
        ticket.updateOne({ status: "closed" });
      }
    });
  } catch (err) {
    console.error("there was an error: ", err);
  }
});

module.exports = router;
