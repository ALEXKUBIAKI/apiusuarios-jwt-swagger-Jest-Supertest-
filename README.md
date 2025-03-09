-------------------------------
Exemplos postman
Para acessar a rota protegida,primeiro gerar o token:
POST:
http://localhost:3000/login
no body, selecionar RAW /JSON e colar isto
{
  "email": "alex@teste.com",
  "password": "minhasenha"
}
será devolvido o token JWT que precisa ser passado como bearer ao acessar a rota get users.
---------------------------------
Listar usuários (rota protegida)
GET:
http://localhost:3000/users
marcar uso de Bearer e colar o token JWT gerado na rota de login
---------------------------------
Cadastrar usuários
POST:
http://localhost:3000/users
Adicionar no body:
{
  "nome" : "usuario teste",  
  "email": "alex@teste.com",
  "password": "minhasenha"
}
----------------------------------
Alterar usuários
PUT
http://localhost:3000/users/1 (1 é o ID do usuário cadastrado)
Adicionar no body:
{
    "nome": "Alex Teste modificado",
    "email": "alex@testemodificado.com",
    "password": "minhasenha"
}
----------------------------------
Deletar usuários:
http://localhost:3000/users/1 (1 é o ID do usuário cadastrado)
----------------------------------
