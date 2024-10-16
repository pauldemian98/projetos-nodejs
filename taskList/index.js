const express = require('express');
const app = express();
const path = require('path')
const bodyParser = require('body-parser')

app.engine('html', require('ejs').renderFile); //utiliza ejs para renderizar o html
app.set('view engine', 'html'); //view engine setada pra ser html
app.use('/public', express.static(path.join(__dirname, 'public'))); //tudo que eh estatico fica em public
app.set('views', path.join(__dirname, './views')); //pasta onde esta as views
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}))

var tarefas = ['Arrumar o quarto', 'ler um livro'];

app.post('/',(req,res)=>{
    tarefas.push(req.body.tarefa)
    res.render('index',{nome:'Demian',tarefasList:tarefas})
})

app.get('/',(req,res)=>{
    res.render('index',{nome:'Demian',tarefasList:tarefas});
})

app.get('/deletar/:id',(req,res) =>{
    tarefas = tarefas.filter(function(val,index){
        if(index != req.params.id){
            return val;
        }
    })
    res.render('index',{nome:'Demian',tarefasList:tarefas});
})

app.listen(5000,()=>{
    console.log('server rodando!')
})