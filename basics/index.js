const http = require("http");        //importando do próprio node
const fs = require("fs");            //manipula Lendo, Deletando, Criando, Atualizando arquivos
const readLine = require('readline') //Lê Inputs

const hostname = "localhost";
const port = 5000;

//Cria novo Arquivo
/*
fs.writeFile('demian.txt', 'testando criar um arquivo texto direto pelo node', function(err){
    if(err) throw err;
    console.log("O Arquivo foi criado com sucesso")
})
*/

//Cria Novo Arquivo ou insere no conteúdo depois do que já existe
/*
fs.appendFile('demian.txt', "\nAgora estou escrevendo outro conteudo", (err)=>{
    if(err) throw err;
    console.log("Salvo novamente com Sucesso");
})
*/

const server = http.createServer((req, res) => {
  if (req.url == "/readingStrings") {
    //Lê o Arquivo e realiza os processos desejados
    fs.readFile("users.txt", function (err, data) {
        let str = data.toString(); //Serve para ver os dados e não o Buffer

        let newStr1 = str.split('/');//Lê a Variável em string e salva como array cada linha sendo definida pelo delimitador

        let newStr2 = str.substr(0,6);//Armazena uma substring definida pelo dev

        console.log(newStr1);
        console.log(newStr2);
    });
  } 
    //Funções para deletar e renomear Arquivos
    else if (req.url == '/RemoveOrRename') {
    //Deleta o arquivo
    fs.unlink('ToDelete.txt', function(err){
        if(err) throw err;
        console.log('Arquivo deletado com Sucesso!')
    })
    //Renomeia o Arquivo
    fs.rename('toRename.txt', 'renamed.txt', function(err){
        if(err) throw err;
        console.log('Arquivo renomeado com sucesso')
    })

  }
  //Lendo Inputs do usuário no terminal
  else if (req.url == '/Inputs') {
    const rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Qual o seu nome?', function(name){
        console.log('o Nome do usuário é: '+name);
        
        rl.question('Qual sua idade?',function(idade){
            console.log("A idade do "+name+" é "+idade)
        })
    })

    rl.on('close', function(){
        console.log('adeus!');
        process.exit(0)
    })

  }
});

server.listen(port, hostname, () => {
  console.log("Servidor está rodando!");
});
