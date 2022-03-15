--Tabela 1
create table usuarios (
codigo serial not null primary key, 
usuario varchar(50) not null,
senha varchar(50) not null,
email varchar(100) not null
);

--Registros 1
insert into usuarios (usuario, senha, email) 
			  values ('christofer', 'senhatop', 'christofersega@gmail.com'),
			         ('jorge', 'topsenha', 'jorgebavaresco@ifsul.edu.br');