import urllib.request as ur
import urllib.error as ue
from bs4 import BeautifulSoup as bs

url="https://www.gizmodo.jp/articles/"

h=ur.urlopen(url)
s=bs(h,"html.parser")
sslist=s.select("body > main > div.l-generalContent-primary.-main.-withSecondary > div.p-archive > ul.p-archive-cardList > li.p-archive-cardItem >article.p-archive-cardPost > div.p-archive-cardMeta > h3.p-archive-cardTitle > a")
print(len(sslist))
for ss in sslist:
    print(ss.text)

url="https://www.gizmodo.jp/articles/2"

h=ur.urlopen(url)
s=bs(h,"html.parser")
sslist=s.select("body > main > div.l-generalContent-primary.-main.-withSecondary > div.p-archive > ul.p-archive-cardList > li.p-archive-cardItem >article.p-archive-cardPost > div.p-archive-cardMeta > h3.p-archive-cardTitle > a")
print(len(sslist))
for ss in sslist:
    print(ss.text)


