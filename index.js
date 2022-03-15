var http = require('http');
const express = require('express')
const httpProxy = require('express-http-proxy')
const app = express()
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const helmet = require('helmet');

require("dotenv-safe").config();
const jwt = require('jsonwebtoken');

const cors = require('cors')
const { pool } = require('./config')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())

const disciplinasServiceProxy = httpProxy('http://localhost:3002');
const alunosServiceProxy = httpProxy('http://localhost:3003');

const login = (request, response, next) => {

    const { usuario, senha } = request.body

    pool.query(
        'select * from usuarios where usuario = $1 and senha = $2',
        [usuario, senha], (error, results) => {
        if (error || results.rowCount == 0) {
            return response.status(500).json({ message: 'Informe usuário e senha corretos!' });
        }

        const codigo = results.rows[0]['codigo'];
        const email = results.rows[0]['email'];
        const roles = [{"role":"user"}, {"role":"admin"}]
        const token = jwt.sign({ codigo, email, roles }, process.env.SECRET, {
            expiresIn: 300 // expira em 5 minutos
        });
        
        return response.json({ auth: true, token: token });
        },
    )
}

function verificaJWT(request, response, next){
    const token = request.headers['x-access-token'];
    if (!token) return response.status(401).json({ auth: false, message: 'Nenhum token recebido.' });
    
    jwt.verify(token, process.env.SECRET, function(err, decoded) {
      if (err) return response.status(500).json({ auth: false, message: 'Erro ao autenticar o token.' });
      
      // Se o token for válido, salva no request para uso posterior
      request.userId = decoded.id;
      request.userEmail = decoded.email;
      request.userRoles = decoded.roles;
      console.log("ID decodificado do token:"  + decoded.id);
      console.log("Email decodificado do token:"  + decoded.email);
      console.log("Roles decodificados do token:"  + JSON.stringify(decoded.roles));      
      next();
    });
}

app.use(logger('dev'));

app
    .route("/login")
    .post(login) 

// Proxy request
// rota para disciplinas e todos os métodos
app.all('/disciplinas', verificaJWT,(req, res, next) => {
    disciplinasServiceProxy( req, res, next);
})
// rota para disciplinas e todos os métodos com um parâmetro ID
app.all('/disciplinas/:id', verificaJWT,( req, res, next) => {
    disciplinasServiceProxy( req, res, next);
})
// rota para alunos e todos os métodos
app.all('/alunos', verificaJWT, (req, res, next) => {
    alunosServiceProxy(req, res, next);
})
// rota para alunos e todos os métodos com um parâmetro ID
app.all('/alunos/:id', verificaJWT, (req, res, next) => {
    alunosServiceProxy(req, res, next);
})

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.listen(process.env.PORT || 3000);
