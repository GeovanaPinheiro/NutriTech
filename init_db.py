
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def criar_tabelas():
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cursor:

            cursor.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS produtos_nome_unique
    ON produtos (nome);
""")

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS produtos (
                    id SERIAL PRIMARY KEY,
                    nome VARCHAR(150) NOT NULL UNIQUE,
                    categoria VARCHAR(100),
                    descricao TEXT,
                    preco NUMERIC(10, 2) NOT NULL
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS estoque (
                    id SERIAL PRIMARY KEY,
                    produto_id INTEGER NOT NULL UNIQUE
                        REFERENCES produtos(id),
                    quantidade INTEGER NOT NULL DEFAULT 0,
                    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

        conn.commit()

    print("Tabelas criadas com sucesso!")

if __name__ == "__main__":
    criar_tabelas()
