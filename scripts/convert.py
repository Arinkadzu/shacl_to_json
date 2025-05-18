from rdflib import Graph
import requests

query = """
PREFIX nobel: <http://data.nobelprize.org/terms/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
CONSTRUCT {
  ?person rdf:type nobel:Laureate ;
    rdfs:label ?name ;
    nobel:nobelPrize ?prize .
  ?prize rdfs:label ?prizeName ;
    nobel:year ?year .
}
WHERE {
  ?person rdf:type nobel:Laureate ;
    rdfs:label ?name ;
    nobel:nobelPrize ?prize .
  ?prize rdfs:label ?prizeName ;
    nobel:year ?year .
  FILTER (lang(?prizeName) = 'en')
}
"""

endpoint = "https://data.nobelprize.org/sparql"
response = requests.post(endpoint, data={"query": query, "format": "application/n-triples"})

with open("e:/LU/Bachelor/datasets/nobel_prizes.nt", "wb") as f:
    f.write(response.content)

print("Данные сохранены в nobel_prizes.nt")