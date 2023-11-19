BEGIN;

CREATE SCHEMA edicao;

CREATE TABLE edicao.tarefa_agendada_cron(
	id SERIAL NOT NULL PRIMARY KEY,
	nome VARCHAR(255) NOT NULL,
	uuid UUID NOT NULL UNIQUE,
	data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
	usuario_id SMALLINT REFERENCES dgeo.usuario(id),
	configuracao_cron VARCHAR(255) NOT NULL,
	data_inicio TIMESTAMP WITH TIME ZONE,
	data_fim TIMESTAMP WITH TIME ZONE,
	parametros json
);

CREATE TABLE edicao.tarefa_agendada_data(
	id SERIAL NOT NULL PRIMARY KEY,
	nome VARCHAR(255) NOT NULL, 
	uuid UUID NOT NULL UNIQUE,
	data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
	usuario_id SMALLINT REFERENCES dgeo.usuario(id),
	data_execucao TIMESTAMP WITH TIME ZONE NOT NULL,
	parametros json
);

CREATE TABLE edicao.execucao(
	id SERIAL NOT NULL PRIMARY KEY,
	uuid UUID NOT NULL UNIQUE,
	status_id SMALLINT NOT NULL REFERENCES dominio.status(code),
	data_execucao TIMESTAMP WITH TIME ZONE NOT NULL,
	tempo_execucao REAL,
	sumario json,
	log TEXT,
	parametros json,
	tarefa_agendada_uuid UUID
);

COMMIT;