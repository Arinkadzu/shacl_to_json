from rdflib import Graph

g = Graph()
g.parse('/mnt/e/LU/Bachelor/qse/example_data.ttl', format='turtle')

g.serialize('/mnt/e/LU/Bachelor/qse/example_data.nt', format='nt')