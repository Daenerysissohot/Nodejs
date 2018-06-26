const express = require('express');  //importation modules
const passport = require('passport');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const app = express();
var Cookies = require( "cookies" )
const url= require("url")
const async = require("async");
app.use(express.static("public"));
app.set('view engine','pug');
app.use(bodyParser.urlencoded({ extended:true}));


var mysql = require('mysql'); 
//CreateTables()
function CreateTables()         //fonction qui crée les tables
{
    var con = mysql.createConnection({  //connection à la base de donnée
        host: "localhost",
        user: "root",
        password: "",
        database: "databaseprojetweb"
      });
      
      con.connect(function(err) { 
        if (err) throw err;
        let sql = "CREATE TABLE products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), description VARCHAR(255), src VARCHAR(255),stock INT, prix INT);";
        let sql3 = "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), mdp VARCHAR(255),email varchar(255), bio varchar(255), role VARCHAR(255), createdAt timestamp, updatedAt timestamp);";
        
        con.query(sql, function (err, result) { //création première table
            if(err) console.log(err.code);
            else 
            console.log("table products créée");

        });

        con.query(sql3, function (err, result) {    //création 2ème table
            if(err) console.log(err.code);
            else 
            console.log("table users créée");
        });
      });
}


async function Render(page,res,req)         //fonction gère les pages principales
{
    var cookies = new Cookies( req, res )

    if(cookies.get("username")!=undefined&&cookies.get("password")!=undefined)      //s'il y a des cookies d'identifications
    {
        const conDB = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "databaseprojetweb"
          });

        cookieUsername=cookies.get("username")
        cookiePassword=cookies.get("password")
        
        conDB.connect(function(err) {


            var sql='select mdp from users where name="'+cookieUsername+'"';    //récupération du mot de passe du user

            conDB.query(sql, function (err, result) {
                if(err) console.log(err.code)

                check=1;
                if(result[0]==undefined)                                            //s'il n'y a pas de résultats : pas de username correspondant
                {
                return res.redirect('authentif');
            }
                else if(result[0].mdp===cookiePassword)                             //si les cookies password/pseudo correspondent, on continue l'execution
                    {console.log("On est connecté")}
                else
                {
                return res.redirect('authentif');
            }
            })
        })
    }
    else
    {
        return res.redirect(302,'authentif');
       // next();
    }


    const conDB = mysql.createConnection({          //on crée la connection à la base de donnée
        host: "localhost",
        user: "root",
        password: "",
        database: "databaseprojetweb"
      });
    
    if(page=="Main")                                    //si c'est la page d'accueil
    {
        tabId=[]
      //  tabDesc=[]
        tabName=[]
        tabSrc=[]

        conDB.connect(function(err) {                   
            if (err) throw err;

          sql="select * from products"                  //récupération de tous les produits
          conDB.query(sql, function (err, result, fields) {
            if (err) throw err;
            
            result.forEach(products => {
               // tabDesc.push(products.title);
                tabName.push(products.name)                 //on stocke dans un tableau les champs que l'on va donner au PUG
                tabSrc.push(products.src)
                tabId.push(products.id)
                
            });
                res.render('home', {                        //on envoie les tableaux pour les afficher sur la page
                    Id : tabId,
                    Name : tabName,
                    Src : tabSrc
                });
        });
        })
    }

else if(page=="AddProduct")                         //page d'ajout de produit
{
    var url_parts = url.parse(req.url, true);       //on récupère les infos necessaires depuis le GET
    var query = url_parts.query;
    var name = req.query.nom;
    var description = req.query.description;
    var src = req.query.src;
    var stock = req.query.stock;
    var prix = req.query.prix;
    if(!(name===""||description===""||src===""||stock===""||prix===""))     //si aucun des champs est nul
    {
        conDB.query('insert into products(name,description,src,stock,prix) VALUES("'+name+'","'+description+'","'+src+'",'+stock+','+prix+')',function(err){    //on ajoute le produit
            return res.redirect("/") //on redirige vers la page principale

        })
    }
else
    res.render("erreur")                                //si un des champs est vide, on affiche la page d'erreur (on peut la personnaliser?)
}
    else if(page=="page"){                              //page pour les détails d'un produit
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        var id = req.query.id;                          //on récupère l'ID du produit

    
        conDB.connect(function(err) {
            let sql="select * from products where id="+id   // on récupère les informations du produit
            tabComment=null;
            
            conDB.query(sql, function (err, result) {
                var desc;
                var src;
                var name;
                if (err) throw err;

                result.forEach(products =>{                 //on récupère les infos du produit
                    desc = products.description
                    src = products.src
                    name = products.name
                    id = products.id
                    prix = products.prix
                    stock = products.stock
                }
                );
                res.render('pages', {                   //on envoie les infos du produit au PUG
                    Desc : desc,
                    Src : src,
                    Name : name,
                    Id : id,
                    Prix : prix,
                    Stock : stock
                });
          });
        });
    }

    else if(page=="/add_to_cart")                   //page qui ne sert qu'au traitement pour l'ajout d'un produit
    {
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        var id = req.query.id;              //on récupère l'ID du produit ajouté


        conDB.query("update products set stock=stock-1 where id ="+id,function(err){
            if(err) console.log(err)
         //on retire 1 au stock
        })
        var cookies = new Cookies( req, res )
        cookieCart = cookies.get("panier")                              //on récup le cookie du panier
        if(cookieCart==undefined)
            cookieCart=""                                               //évite d'avoir un cookie qui ressemble à "undefined1/"
        cookies.set("panier",cookieCart+id+"/")                         //on ajoute au cookie l'ID du produit acheté
        return res.redirect("/")                                        //on redirige vers la page d'accueil
    }
    else if(page=="cart")
    {
        var cookies = new Cookies( req, res )
        var cookiecontent = cookies.get("panier")
        try{
        tabCookie=cookiecontent.split("/")
        tabCookie=tabCookie.sort()
        tabnumber=[]
        tabcount=[]
        prev=tabCookie[0]
        index=0;
        for(i=1;i<tabCookie.length;i++){
            if(tabnumber.includes(tabCookie[i]))
            {
                tabcount[index]++
            }

            else
            {
                tabnumber[index]=tabCookie[i]
                index++
                tabcount[index]=1
                prev=tabCookie[index]
            }
        }

        tabcount=tabcount.slice(1,tabcount.length)

        tabProductName=[]
        tabProductImage=[]
        sql="select * from products"
        conDB.query(sql,function(err,data){
            if(err) console.log(err)
            console.log(data)
            for(i=0;i<tabnumber.length;i++)
                if(data[parseInt(tabnumber[i])-1]!=undefined)
                    {tabProductName.push(data[parseInt(tabnumber[i])-1].name)
                tabProductImage.push(data[parseInt(tabnumber[i])-1].src)}


            res.render("cart", {
                ProductName : tabProductName,
                TabNumber : tabcount,
                TabImage : tabProductImage
            });
        })
    }
    catch(err){
        res.render("cart", {
            ProductName : [],
            TabNumber : [],
            TabImage : []
        });
    }
    }
}
app.get('/', (req, res ) => {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: ""
      });
      
      con.connect(function(err) {
        if (err) throw err;
          let sql="CREATE DATABASE databaseprojetweb"
        con.query(sql, function (err, result) {
          if (err!=null&&err.code=="ER_DB_CREATE_EXISTS") console.log("database déjà créée");
          else if(err) throw err;
          else
          CreateTables()
          Render("Main",res,req)
        });
        
      });
});


app.get('/authentif', (req, res ) => {   // lien authentif pour authentification.pug

    res.render('authentification', {
    });
      //  res.send("Page d'authentification")
      //Render("page",res,req)
});

app.get('/pages', (req, res ) => {     // lien pour pages

    /*console.log("je suis sur une page")
    console.log(req.body)*/
    const conDB = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "databaseprojetweb"
      });

      Render("page",res,req)

});
app.get('/add_to_cart', (req, res ) => {

    Render("/add_to_cart",res,req)
});
app.get('/api/product', (req, res ) => {

    Render("AddProduct",res,req)
});

app.get('/api/comment', (req, res ) => {

    Render("AddComment",res,req)
});

app.get('/api/question', (req, res ) => {

    Render("AddQuestion",res,req)
});

app.get('/inscription', (req, res ) => {

    res.render('inscription');
});

app.get('/cart', (req, res ) => {

    Render('cart',res,req);
});

app.get('/validerInscription', (req, res ) => {     // lecture des valeurs pour l'inscription

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var pseudo=req.query.pseudo
    var password = req.query.password;
    var pseudo = req.query.pseudo;
    var mail = req.query.mail;
    var bio = req.query.bio;
   // var role = req.query.bio;
   const conDB = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "databaseprojetweb"
  });                                   // insertion des colonnes pour la tables users
  let sql='INSERT INTO users (name,mdp,email,bio,role,createdAt,UpdatedAt) VALUES("'+pseudo+'","'+password+'","'+mail+'","'+bio+'","user",NOW(),NOW())'
  conDB.query(sql,function(err){
    if(err) {console.log(err)
        res.render("erreur")}
        else{
    res.redirect('/');}

  })
    


    //res.redirect('/');
});

app.get('/testCo', (req, res ) => {

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var password = req.query.password;
    var pseudo = req.query.pseudo;

    var conDB = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "databaseprojetweb"
      });

      conDB.connect(function(err) {
          sql = "select id from users where (name='"+pseudo+"' and mdp ='"+password+"')";
    conDB.query(sql, function (err, result) {
        if(err) throw err

        if(result[0]==undefined){

        }
        else
        {
            var cookies = new Cookies( req, res )
            cookies.set("username",pseudo)
            cookies.set("password",password)
            setTimeout(function(){
                res.redirect("/");
            },1000)
          //  res.send("vous allez être rediriger")

        }
            

    });
});
});
app.listen(3000, () => {
    console.log('listening on port 3000'); //lancement du serveur
});
