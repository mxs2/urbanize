import requests

url = "https://servicodados.ibge.gov.br/api/v3/agregados/4093/periodos/201201-202602/variaveis/4099?localidades=N3[26]&classificacao=2[all]"

r = requests.get(url)

# print(r)

data = r.json()

print("Variável: ", data[0]["id"], "-", data[0]["variavel"])

# print(data[0]['resultados'][2]['classificacoes'][0]['categoria'])
# print(data[0]['resultados'][2]['series'][0]['serie'])

# for _ in range(len(data[0]['resultados'])):
#     print(data[0]['resultados'][_]['classificacoes'][0]['categoria'])
#     print(data[0]['resultados'][_]['series'][0]['serie'])

for _ in range(len(data[0]["resultados"])):
    dt = data[0]["resultados"][_]["series"][0]["serie"]
    with open(f"ibge_{_}.json", "w", encoding="UTF-8") as f:
        f.write(str(dt))
