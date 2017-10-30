//dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var expressHandlebars = require("express-handlebars");

//Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/mongoMongo", {
    useMongoClient: true
});

// Routes
app.get("/scrape", function(req, res) {
    axios.get("http://www.nytimes.com/").then(function(response) {
        var $ = cheerio.load(response.data);

        $("h2.story-heading").each(function(i, element) {
            var result = {};

            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            db.Article
                .create(result)
                .then(function(dbArticle) {
                    res.send("Scrape Complete");
                })
                .catch(function(err) {
                    res.json(err);
                });
        });
    });
});

app.get("/articles", function(req, res) {
    db.Article
        .find({})
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.get("/articles/:id", function(req, res) {
    db.Article
        .findOne({
            _id: req.params.id
        })
        .populate("note")
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.post("/articles/:id", function(req, res) {
    db.Note
        .create(req.body)
        .then(function(dbNote) {
            return db.Article.findOneAndUpdate({
                _id: req.params.id
            }, {
                note: dbNote._id
            }, {
                new: true
            });
        })
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.engine("handlebars", expressHandlebars({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});