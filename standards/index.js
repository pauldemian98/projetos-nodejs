const customModule1 = require('./modules/customModule1.js')
const CustomModule2 = require('./modules/customModule2.js')


//Uso de módulos sem Classe
customModule1.helloDemian();

console.log(customModule1.dados.nome)
console.log(customModule1.dados.idade)

console.log(customModule1.quantidade)

//Uso de módulos com uso de Classe

//Acessando a variavel nome pela primeira forma
new CustomModule2()

//Acessando a variavel nome pela segunda forma
const dados = new CustomModule2();
console.log(dados.nome);