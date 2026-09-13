-- Script de criação da estrutura do banco de dados MedClinic API
-- Etapa 1: Autenticação e Autorização

CREATE TYPE user_role AS ENUM ('administrador', 'atendente');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR NOT NULL,
    role user_role NOT NULL DEFAULT 'atendente',
    data_criacao TIMESTAMP NOT NULL DEFAULT now()
);

-- Observação: em desenvolvimento, o TypeORM cria/atualiza esta estrutura
-- automaticamente através da opção "synchronize: true" no data-source.ts,
-- a partir da entidade User. Este script serve como documentação do
-- schema e como alternativa para criação manual/produção.
