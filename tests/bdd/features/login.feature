Feature: Login de usuário
  Como um usuário
  Eu quero fazer login no sistema
  Para acessar minhas informações

  Scenario: Login com credenciais válidas
    Given que eu tenho um email "cidadao@urbanize.com" e senha "demo"
    When eu envio uma requisição de login
    Then eu devo receber um token de autenticação

  Scenario: Login com credenciais inválidas
    Given que eu tenho um email "invalido@urbanize.com" e senha "senhaerrada"
    When eu envio uma requisição de login
    Then eu devo receber uma mensagem de erro "Credenciais inválidas."