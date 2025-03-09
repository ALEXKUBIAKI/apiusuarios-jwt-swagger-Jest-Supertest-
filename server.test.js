const request = require('supertest');
const app = require('./server'); // Aponte para o seu arquivo do servidor

// Mock para o envio do token JWT
let token;
let userId;

beforeAll(async () => {
    // Garante que a lista de usuários está limpa antes de rodar os testes
    // Adiciona um usuário de teste diretamente na lista de memória
    const response = await request(app)
        .post('/users')
        .send({ nome: 'Admin', email: 'admin@example.com', password: 'password123' });

    userId = response.body.id;

    // Gera um token JWT válido usando as credenciais do usuário de teste
    const loginResponse = await request(app)
        .post('/login')
        .send({ email: 'admin@example.com', password: 'password123' });

    token = loginResponse.body.accessToken;
});

// Teste da rota POST /login (Login)
describe('POST /login', () => {
    it('Deve gerar um token JWT com credenciais corretas', async () => {
        const response = await request(app)
            .post('/login')
            .send({ email: 'admin@example.com', password: 'password123' });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
    });

    it('Deve retornar erro com credenciais incorretas', async () => {
        const response = await request(app)
            .post('/login')
            .send({ email: 'wrongemail@example.com', password: 'wrongpassword' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Usuário não encontrado');
    });
});

// Teste da rota GET /users (Listar usuários)
describe('GET /users', () => {
    it('Deve retornar a lista de usuários com um token válido', async () => {
        const response = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    nome: expect.any(String),
                    email: expect.any(String),
                }),
            ])
        );
    });

    it('Deve retornar erro com token inválido', async () => {
        const response = await request(app)
            .get('/users')
            .set('Authorization', 'Bearer invalidtoken');
        
        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Token inválido');
    });
});

// Teste da rota POST /users (Criar um novo usuário)
describe('POST /users', () => {
    it('Deve criar um novo usuário', async () => {
        const response = await request(app)
            .post('/users')
            .send({ nome: 'Teste', email: 'teste@example.com', password: 'password123' });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.nome).toBe('Teste');
    });

    it('Deve retornar erro se dados estiverem faltando', async () => {
        const response = await request(app)
            .post('/users')
            .send({ nome: 'Teste', email: 'teste@example.com' }); // Senha ausente

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Nome, e-mail e senha são obrigatórios');
    });
});

// Teste da rota PUT /users/:id (Atualizar usuário)
describe('PUT /users/:id', () => {
    it('Deve atualizar o usuário corretamente', async () => {
        const response = await request(app)
            .put(`/users/${userId}`)
            .send({ nome: 'Admin Atualizado', email: 'admin_atualizado@example.com', password: 'newpassword123' });

        expect(response.status).toBe(200);
        expect(response.body.nome).toBe('Admin Atualizado');
        expect(response.body.email).toBe('admin_atualizado@example.com');
    });

    it('Deve retornar erro se o usuário não for encontrado', async () => {
        const userIdInexistente = 999; // ID inexistente
        const response = await request(app)
            .put(`/users/${userIdInexistente}`)
            .send({ nome: 'User Não Encontrado', email: 'nao_encontrado@example.com', password: 'password123' });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Usuário não encontrado');
    });
});

// Teste da rota DELETE /users/:id (Deletar usuário)
describe('DELETE /users/:id', () => {
    it('Deve excluir um usuário com sucesso', async () => {
        const response = await request(app)
            .delete(`/users/${userId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(204);
    });

    it('Deve retornar erro se o usuário não for encontrado', async () => {
        const userIdInexistente = 999; // ID inexistente
        const response = await request(app)
            .delete(`/users/${userIdInexistente}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Usuário não encontrado');
    });
});
