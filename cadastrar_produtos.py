
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

produtos = [
    ("Whey Protein 100%", "Suplementos", "Proteína de alta pureza para força, recuperação e definição muscular.", 149.90),
    ("Creatina Pura", "Suplementos", "Potência e performance para treinos mais intensos e consistentes.", 99.90),
    ("Pré-Treino", "Suplementos", "Energia, foco e disposição para evoluir em cada sessão.", 129.90),
    ("Multivitamínico", "Suplementos", "Suporte diário para energia, bem-estar e rotina mais equilibrada.", 79.90),
    ("Barra Banana com Canela", "Snacks", "Uma opção leve, sofisticada e prática para acompanhar o dia.", 19.90),
    ("Barra Chocolate com Amendoim", "Snacks", "Proteína e sabor em uma combinação que eleva o lanche.", 22.90),
    ("Barra Morango e Chocolate Branco", "Snacks", "Uma proposta doce e equilibrada com textura premium.", 24.90),
    ("Bebida Láctea de Morango", "Bebidas", "Prática, saborosa e ideal para reforçar energia entre refeições.", 18.90),
    ("Bebida Láctea de Baunilha", "Bebidas", "Leve, cremosa e delicada para um lanche saboroso com mais conforto.", 18.90),
    ("Bebida Láctea de Chocolate", "Bebidas", "Uma bebida sofisticada, nutritiva e perfeita para manter o ritmo.", 18.90),
    ("Camisa de Academia", "Roupas", "Leve, confortável e pensada para treinos com alto desempenho.", 89.90),
    ("Calça de Academia", "Roupas", "Conforto, mobilidade e acabamento refinado para a rotina ativa.", 119.90),
    ("Top Feminino", "Roupas", "Design moderno, ajuste preciso e presença premium no treino.", 79.90)
]

def cadastrar():
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cursor:
            for nome, categoria, descricao, preco in produtos:
                cursor.execute("""
                    INSERT INTO produtos (nome, categoria, descricao, preco)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    RETURNING id
                """, (nome, categoria, descricao, preco))

                resultado = cursor.fetchone()

                if resultado:
                    produto_id = resultado[0]

                    cursor.execute("""
                        INSERT INTO estoque (produto_id, quantidade)
                        VALUES (%s, 0)
                    """, (produto_id,))

        conn.commit()

    print("Cadastro dos produtos concluído!")

if __name__ == "__main__":
    cadastrar()
