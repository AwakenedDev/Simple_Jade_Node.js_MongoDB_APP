var express = require('express'),
    app = express(),
    engines = require('consolidate'),
    mongo = require('mongodb').MongoClient,
    assert = require('assert');
    bodyParser = require('body-parser')

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

var compFound;
var found;
var alive;
var companyLink;
var emailAddress;
var phoneNumber;
var descrip;
var loc;
var age;
var more;
var NamesCEO = [];
var productsNumber;
var MoneyTotal;
var numEmployees;
var foundString = "";

var urlencodedParser = bodyParser.urlencoded({extended : false})

app.get('/', function (req, res) {
    res.render("home")
})

app.post('/', urlencodedParser, function (req, res) {
    var company_name = req.body.company_name;
    var extended = req.body.extended

    if (company_name === "" || ((extended !== "1") && (extended !== "2")) ) {
        res.render("home", {message: "Please fill all the required fields"})
    }
    else {
        var company_name2 = "/" + company_name
        if (extended === '1') {
            res.redirect(company_name2+"?more=true")
        }
        else if (extended === '2'){
            res.redirect(company_name2+"?more=false")
        }
    }
})

var databaseUrl = 'mongodb://user:admin@ds011419.mlab.com:11419/laroche';

app.get('/:name', function (req, res) {

    mongo.connect(databaseUrl, function (err, db) {

        var company = req.params.name;
        more = req.query.more;


        if (err) {
            res.render('error', {
                message: "Connection to database cannot be established",
                error: 404
            })
        }
        else {

            var compString = "^" + company + "$";

            var cursor = db.collection("companies").find({"name": {$regex: compString, $options: "i"}}, {
                "_id": 0,
                "name": 1
            });

            cursor.toArray(function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    if (result.length > 0) {
                        compFound = result[0].name;
                        console.log("Found:" + compFound)
                        compUrl();
                    }
                    else {
                        res.render('error', {
                            message: "'" + company + "' " + "not found in the Crunchbase database",
                            error: 404
                        })
                    }

                }
            });

            //The company's website
            function compUrl() {
                var companyUrl = db.collection("companies").find({"name": {$regex: compString, $options: "i"}}, {
                    "_id": 0,
                    "homepage_url": 1
                });

                companyUrl.toArray(function (err, companyUrl2) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            if (!(companyUrl2[0].homepage_url === null || companyUrl2[0].homepage_url === "")) {
                                companyLink = companyUrl2[0].homepage_url;
                            }
                            else {
                                companyLink = "Website not available"
                            }
                            foundedYear();
                        }

                    }
                )

            }

            //Founded _year of the company
            function foundedYear() {
                var founded = db.collection("companies").find({"name": {$regex: compString, $options: "i"}}, {
                    "_id": 0,
                    "founded_year": 1
                });

                founded.toArray(function (err, founded2) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        if (!(founded2[0].founded_year === null || founded2[0].founded_year === "")) {
                            found = founded2[0].founded_year;
                        }
                        else {
                            found = 0 + " - Not Available"
                            foundString = "Not Available"
                        }

                        email();
                    }

                })

            }

            //The company's email address
            function email() {
                var email = db.collection("companies").find({"name": {$regex: compString, $options: "i"}}, {
                    "_id": 0,
                    "email_address": 1
                });

                email.toArray(function (err, email2) {
                    if (err) {
                        console.log(err);
                    }
                    else {

                        if (!(email2[0].email_address === null || email2[0].email_address === "")) {
                            emailAddress = email2[0].email_address;
                        } else {
                            emailAddress = "Email not Available"
                        }

                        number();

                    }

                })

            }

            //The company's phoneNumber
            function number() {
                var number = db.collection("companies").find({"name": {$regex: compString, $options: "i"}}, {
                    "_id": 0,
                    "phone_number": 1
                });

                number.toArray(function (err, number2) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        if (!(number2[0].phone_number === null || number2[0].phone_number === "")) {
                            phoneNumber = number2[0].phone_number;
                        } else {
                            phoneNumber = "Phone Number not Available"
                        }

                        description();
                    }

                })

            }

            //The company's description
            function description() {
                var desc = db.collection("companies").find({"name": {$regex: compString, $options: "i"}}, {
                    "_id": 0,
                    "description": 1
                });

                desc.toArray(function (err, desc2) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        if (!(desc2[0].description === null || desc2[0].description === "")) {
                            descrip = desc2[0].description;

                        } else {
                            descrip = "Description Not Available"
                        }

                        location();
                    }

                })

            }

            //The company's location (Cities)
            function location() {

                var location = db.collection("companies").distinct("offices.city", {
                    "name": {
                        $regex: compString,
                        $options: "i"
                    }
                }, (function (err, cities) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        if (!(cities.toString() === null || cities.toString() === "")) {
                            loc = cities.toString();
                        } else {
                            loc = "Not Available"
                        }
                        CEO()
                    }
                }))

            }


            //The company's CEOs
            function CEO() {
                var ceoName = db.collection('companies').aggregate([
                    {$match: {"name": {$regex: compString, $options: "i"}}},
                    {$unwind: "$relationships"},
                    {$match: {"relationships.title": {$regex: "CEO"}}},
                    {
                        $project: {
                            _id: 0,
                            FirstName: "$relationships.person.first_name",
                            LastName: "$relationships.person.last_name",
                        }
                    },

                ]);

                ceoName.toArray(function (err, ceoName2) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        if (ceoName2.length > 0) {
                            var Names = [];
                            ceoName2.forEach(function (ceo) {
                                Names.push(ceo.FirstName + " " + ceo.LastName)
                                NamesCEO = Names.toString()
                            })
                        } else {
                            NamesCEO = "CEO information not available"
                        }
                        Employees();
                    }

                });
            }

            //The company's employees' number
            function Employees() {
                var employees = db.collection("companies").find({"name": {$regex: compString, $options: "i"}}, {
                    "_id": 0,
                    "number_of_employees": 1
                });

                employees.toArray(function (err, employees2) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        if (!(employees2[0].number_of_employees === null || employees2[0].number_of_employees === "")) {
                            numEmployees = employees2[0].number_of_employees;
                        }
                        else {
                            numEmployees = "Number not available"
                        }
                        productsNum();
                    }

                })

            }

            //The company's product number
            function productsNum() {
                var products = db.collection('companies').aggregate([
                    {$match: {"name": {$regex: compString, $options: "i"}}},
                    {
                        $project: {
                            _id: 0,
                            NumofProducts: {$size: "$products"}
                        }
                    }
                ]);

                products.toArray(function (err, products2) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        if (!(products2[0].NumofProducts === null || products2[0].NumofProducts === "")) {
                            productsNumber = products2[0].NumofProducts;
                        } else {
                            productsNumber = "Number not available"
                        }
                        ageOfCompany();
                    }

                });

            }

            //Age of company
            function ageOfCompany() {
                var year = new Date().getFullYear();
                var found2 = parseInt(found);

                if (foundString === "Not Available") {
                    age = "Cannot be calculated. Missing Founded Year"
                    foundString = "";
                }
                else {
                    age = year - found2;
                }

                totalMoney();

            }

            //Company's total money raised
            function totalMoney() {
                var money = db.collection("companies").find({"name": {$regex: compString, $options: "i"}}, {
                    "_id": 0,
                    "total_money_raised": 1
                });

                money.toArray(function (err, money2) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        if (!(money2[0].total_money_raised === null || money2[0].total_money_raised === "")) {
                            MoneyTotal = money2[0].total_money_raised;
                        }
                        else {
                            MoneyTotal = "Money information not Available"
                        }

                        isAlive();
                    }

                })

            }


            //If company is alive or not
            function isAlive() {
                alive = db.collection("companies").find({
                        "name": {
                            $regex: compString,
                            $options: "i"
                        }
                    },
                    {"_id": 0, "deadpooled_year": 1}
                )

                alive.toArray(function (err, alive2) {
                        if (err) {
                            console.log(err);
                        }
                        else {

                            var al = alive2[0].deadpooled_year;

                            var alive3

                            if (al > 0) {
                                var alive3 = "Company is Not Alive"

                            }
                            else if (alive2[0].deadpooled_year === null) {
                                var alive3 = "Company is Alive"
                            }
                            else {
                                var alive3 = "'Alive' Status not Found"
                            }

                            results(compFound, companyLink, found, alive3, emailAddress, phoneNumber, descrip, loc, more, NamesCEO, numEmployees, productsNumber, age, MoneyTotal);
                        }

                    }
                )
            }

            function results(company, companyUrl, founder_year, alive, emailAddr, phoneNumber2, descrip2, loc2, more2, NamesCEO2, numEmployees2, productsNumber2, Age, MoneyTotal2) {
                res.render('companies', {
                    title: company,
                    URLcompany: companyUrl,
                    foundedYear: founder_year,
                    aliveHey: alive,
                    Email: emailAddr,
                    phoneNum: phoneNumber2,
                    description: descrip2,
                    Location: loc2,
                    More: more2,
                    CEOFLName: NamesCEO2,
                    EmployeesNum: numEmployees2,
                    NumofProd: productsNumber2,
                    AgeofCompany: Age,
                    Money: MoneyTotal2

                })
            }
        }
    })
    ;
})
;

app.use(function (req, res) {
    res.render('error', {message: "Page not found", error: 404})
});

var server = app.listen(5000, function () {
    var port = server.address().port;
    console.log('Express server listening on port %s.', port);
});





