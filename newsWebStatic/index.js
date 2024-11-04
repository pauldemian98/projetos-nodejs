const express = require('express');
const app = express();
const path = require('path')
const bodyParser = require('body-parser')

app.engine('html', require('ejs').renderFile); //utiliza ejs para renderizar o html
app.set('view engine', 'html'); //view engine setada pra ser html
app.use('/public', express.static(path.join(__dirname, 'public'))); //tudo que eh estatico fica em public
app.set('views', path.join(__dirname, './pages')); //pasta onde esta as views
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}))

app.get('/', (req,res) => {
    console.log(req.query)

    if(req.query.busca == null){
        res.render('home',{});
    } else {
        res.render('busca', {});
    }
})

app.get('/:slug', (req,res) => {
    res.render('single',{});
})

app.listen(5000,()=>{
    console.log('server rodando!')
})