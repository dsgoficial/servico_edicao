# Serviço de Edição

Serviço em Node.js para gerenciamento da edição cartográfica

As vantagens são:
* Centralização da exportação de produtos editados
* Elimina a necessidade da instalação do Ferramentas de Edição em cada máquina
* Integração com [QGIS 3](https://www.qgis.org/) via [DSGTools](https://github.com/dsgoficial/DsgTools) e com o [Sistema de Apoio a Produção](https://github.com/1cgeo/sap)
* Possibilidade de agendar a execucão de exportação utilizando a sintaxe do CRON ou informando uma data de execução
* Cliente web para configuração do serviço com um dashboard de acompanhamento

Para sua utilização é necessária a utilização do [Serviço de Autenticação](https://github.com/1cgeo/auth_server)
