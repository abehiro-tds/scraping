import urllib.request as ur
import urllib.error   as ue
from bs4 import BeautifulSoup as bs


url = "https://www.av01.tv/actor"
ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
headers = {'User-Agent': ua}

#ページ数取得
r=ur.Request(url,None,headers)
h=ur.urlopen(r)
s=bs(h,"html.parser")
lastpage=s.select_one("div.hidden-xs:nth-child(3) > ul:nth-child(1) > li:last-child > li:last-child > li:nth-child(2) > a:first-child")
lastpage_num=int(lastpage.text)

#全リスト取得
for p in range(1,lastpage_num+1):
  print("page:"+str(p)+" retreiving...")
  r=ur.Request(url+"?page="+str(p),None,headers)
  h=ur.urlopen(r)
  s=bs(h,"html.parser")
  #ss=s.select_one(".col-md-9 > div:nth-child(1)")
  #sslist=s.select("div.col-sm-6:nth-child > a:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)")
  sslist=s.select("div.col-sm-6 > a:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)")
  for ss in sslist:
    print(ss.text.replace('\n',''))
