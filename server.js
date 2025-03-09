const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Lista de memória
let users = [
    { id: 1, nome: 'Admin', email: 'admin@example.com', password: bcrypt.hashSync('password123', 10) } 
];

// Middleware de autenticação JWT para proteger a rota GET /users
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // "Bearer <token>"

    if (!token) return res.status(403).json({ message: 'Acesso negado. Token não encontrado.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido' });
        req.user = user;
        next();
    });
};

// Configuração do Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Usuários',
            version: '1.0.0',
            description: 'Uma API simples de usuários com autenticação JWT.',
        },
        security: [
            {
                BearerAuth: [] // Remova o comentário do meio da lista
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'  // Define que o formato esperado é JWT
                }
            }
        }
    },
    apis: ['server.js'], // Onde está o arquivo com a definição das rotas (aqui usamos "server.js")
};

// Criação do Swagger JSDoc
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Usando Swagger UI no Express
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Endpoint de login - Gera o token JWT
/**
 * @swagger
 * /login:
 *   post:
 *     description: Autenticar usuário e gerar token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token gerado com sucesso
 *       400:
 *         description: Credenciais inválidas ou usuário não encontrado
 */
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ message: 'Usuário não encontrado' });

    // Verifica a senha
    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err || !isMatch) return res.status(400).json({ message: 'Credenciais inválidas' });

        // Gera o JWT
        const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken });
    });
});

// Rota GET /users → Retorna a lista de usuários cadastrados
/**
 * @swagger
 * /users:
 *   get:
 *     description: Retorna a lista de usuários cadastrados
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       403:
 *         description: Acesso negado. Token inválido ou ausente.
 */
app.get('/users', authenticateToken, (req, res) => {
    res.json(users);
});

// Rota POST /users → Adiciona um novo usuário
/**
 * @swagger
 * /users:
 *   post:
 *     description: Adiciona um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos (nome, e-mail ou senha ausentes)
 */
app.post('/users', (req, res) => {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
        return res.status(400).json({ message: "Nome, e-mail e senha são obrigatórios" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
        id: users.length + 1,
        nome,
        email,
        password: hashedPassword
    };

    users.push(newUser);
    res.status(201).json(newUser);
});

// Rota PUT /users/:id → Atualiza os dados de um usuário pelo ID
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     description: Atualiza os dados de um usuário pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do usuário a ser atualizado
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { nome, email, password } = req.body;

    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Atualizando o usuário
    users[userIndex] = { id: userId, nome, email, password: password ? bcrypt.hashSync(password, 10) : users[userIndex].password };
    res.json(users[userIndex]);
});

// Rota DELETE /users/:id → Remove um usuário pelo ID
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     description: Remove um usuário pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do usuário a ser removido
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuário removido com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Remover o usuário
    users.splice(userIndex, 1);
    res.status(204).end(); // No content, apenas remove o usuário
});

// Iniciar o servidor apenas se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
}

module.exports = app; // Exporta o app para ser utilizado nos testes
