var timerId;
var timeout=1000;
var active;
var ipmas = document.getElementById("ip-http").innerHTML.split(",");                                                     // массив IP для управления
window.onfocus = function() { active = true; clearTimeout(timerId); timeout=500; GetStatus(); };
window.onblur = function() { active = false; clearTimeout(timerId); };


function HideS(s)
{
var t=document.getElementById(s);
if (t) t.className=s+" hide";
}
function ShowInfo()
{
document.getElementById("info").className="info show";
HideS("settings");
HideS("alarms");
HideS("main");
HideS("log");
return false;
}
function ShowSettings()
{
	e=document.getElementById("settings");
	if (e)
	{
		e.className="settings show";
		HideS("info");
		return false;
	} else
		return true;
}
function ShowAlarms()
{
	e=document.getElementById("alarms");
	if (e)
	{
		e.className="alarms show";
		HideS("info");
		return false;
	} else
		return true;
}
function ShowLog()
{
	e=document.getElementById("log");
	if (e)
	{
		e.className="log show";
		HideS("info");
		return false;
	} else
		return true;
}
function ShowMain()
{
	e=document.getElementById("main");
	if (e)
	{
		e.className="main show";
		HideS("info");
		return false;
	} else
		location.href='/';
}
function UpdateLog()
{
	var request = new XMLHttpRequest();
	request.onreadystatechange = function()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			var rows = document.getElementById('log_table').getElementsByTagName('tr'), index;

			for (index = rows.length - 1; index >= 0; index--)
			{
				if (rows[index].className != 'sect_name')
					rows[index].parentNode.removeChild(rows[index]);
			}
			rows[0].insertAdjacentHTML("afterend", this.responseText);
		}
	}
	// send HTTP GET request
	request.open("GET", "log?table");
	request.send(null);
}

function st(t, id, tag)
{
	f=t.responseXML.getElementsByTagName(tag)[0]; 
	h = document.getElementById(id);
	if(f && h) h.innerHTML = f.childNodes[0].nodeValue; 
}
function GetStatus()                                                                                // модифицирован
{
  if (active) {
    nocache = "&nocache=" + Math.random() * 1000000;
	if (ipmas[0].length<5) {m1 = 0;} else {m1 = 1;}                                                 // если в 0 элементе < 5 символов то IPшников для управления нет. Почему так? Потому что пустой массив имеет длину 1 строку, и 1 IP тоже одна строка
	requests = new Array(ipmas.length+m1);                                                          // массив запросов
	request = new Array(ipmas.length+m1);                                                           // массив адресов запросов
	request[0] = "xml";                                                                             // самого себя не забываем, он нулевой
	if (ipmas[0].length>5) {for (let i=0; i<ipmas.length; i++){ request[i+1] = "http://"+ipmas[i]+"/xml";}  }                         // заполняем адресами с первого до сколько IP
                                                                                                    // дальше цикл или 1 раз (самого себя опросим) или 1 + сколько есть IP
	for (let key=0; key<request.length; key++) {
      requests[key] = new XMLHttpRequest();
	  requests[key].onreadystatechange = function() {		
	    if (this.readyState == 4) {
	      if (this.status == 200) {
	        if (this.responseXML != null) {
	          if (key == 0) {
	            st(this, "time", 'Time');
            	st(this, "RSSI", 'RSSI');
            	st(this, "uptime", 'UpTime');
            	st(this, "pos", 'Now');
            	st(this, "dest", 'Dest');
            	st(this, "switch", 'End1');
            	st(this, "mqtt", 'MQTT');
            	st(this, "voltage", 'Voltage');
            	st(this, "led_mode", 'Mode');
            	st(this, "led_level", 'Level');
            	lc=document.getElementById("log_count").innerHTML;
            	st(this, "log_count", 'Log');
            	if (document.getElementById("log_count").innerHTML != lc &&
            		document.getElementById("log")) UpdateLog();
            	if (document.getElementById("pos").innerHTML != document.getElementById("dest").innerHTML)
            	timeout=500;
            	else
            	timeout=2000;  
              } else {                                                                                                     // если не нулевой элемент массива, то берем из ответа Name, Max и Now и сразу вставляем в свой блок на свое место
				st(this, "mainip_name-"+(key-1), 'Name');  
				st(this, "ipmax-"+(key-1), 'Max'); 
                st(this, "ipnow-"+(key-1), 'Now');
                if (document.getElementById("mainip_proc-"+(key-1)) !== null) {
					 document.getElementById("mainip_proc-"+(key-1)).innerHTML = Math.round(document.getElementById("ipnow-"+(key-1)).innerHTML / document.getElementById("ipmax-"+(key-1)).innerHTML * 100)+"%";	}
			  }
            } 
          }
	    }
      }
      // send HTTP GET request        ругается собака, что безопастностью CORS нельзя получать ответ на запрос другого IP
      //                              (привод (1й IP) шлет ведомому запрос (2ой IP), а наш браузер, где работает код js (3ий IP) хочет узнать что 2ой IP ответит 1му IP,
      //                              но мы не пальцем cделаны, и в предыдущем обновлении прошивки разрешили (по безопасности CORS) отдавать ответ кому угодно!!! Радуемся что так можно, а то парсили бы ESPхой и ей же перестраивали DOM.
      requests[key].open("GET", request[key]);
      requests[key].send(null);
	}
  }
  timerId = setTimeout('GetStatus()', timeout);
}
function Call(url)
{
clearTimeout(timerId);
var xhttp = new XMLHttpRequest();
xhttp.open("GET", url);
xhttp.send();
timeout=500;
GetStatus();
}

function Open(tip_open) {
	switch (tip_open)
	{                                                                                                   // если 77 откр только себя, 99 себя и всех в массиве, 91-95 в пресет себя и всех в массиве
	  case 77:
		Call("set?pos=0");
		break;
	  case 99:
		Call("set?pos=0"); 
		if (ipmas[0].length>5) {for (let key=0; key<ipmas.length; key++) { Call("http://"+ipmas[key]+"/set?pos=0"); }}       
		break;
	  case 91:
		Call("set?preset=1");
		if (ipmas[0].length>5) {for (let key=0; key<ipmas.length; key++) { Call("http://"+ipmas[key]+"/set?preset=1"); }}
		break;
	  case 92:
		Call("set?preset=2");
		if (ipmas[0].length>5) {for (let key=0; key<ipmas.length; key++) { Call("http://"+ipmas[key]+"/set?preset=2"); }}
		break;
	  case 93:
		Call("set?preset=3");
		if (ipmas[0].length>5) {for (let key=0; key<ipmas.length; key++) { Call("http://"+ipmas[key]+"/set?preset=3"); }}
		break;
	  case 94:
		Call("set?preset=4");
		if (ipmas[0].length>5) {for (let key=0; key<ipmas.length; key++) { Call("http://"+ipmas[key]+"/set?preset=4"); }}
		break;
	  case 95:
		Call("set?preset=5");
		if (ipmas[0].length>5) {for (let key=0; key<ipmas.length; key++) { Call("http://"+ipmas[key]+"/set?preset=5"); }}
		break;
	  default:
		Call("http://"+ipmas[tip_open]+"/set?pos=0");
		break;
	}
return false; }
function Close(tip_close) {                                                                                  // по принципу Open отработка закрытия
	if (tip_close == 77) {
	  Call("set?pos=100");} else {
	  if (tip_close == 99) { 
        Call("set?pos=100"); 
	    if (ipmas[0].length>5) {for (let key=0; key<ipmas.length; key++) { Call("http://"+ipmas[key]+"/set?pos=100"); }}} else {
		  Call("http://"+ipmas[tip_close]+"/set?pos=100"); }}
    return false; }
function Steps(s) { Call("set?steps="+s); return false; }
function StepsOvr(s) { Call("set?stepsovr="+s); return false; }
function Stop(tip_stop) {                                                                                     // по принципу Open отработка стоп
	if (tip_stop == 77) {
		Call("stop");} else {
	    if (tip_stop == 99) { 
          Call("stop"); 
	      if (ipmas[0].length>5) {for (let key=0; key<ipmas.length; key++) { Call("http://"+ipmas[key]+"/stop"); }}} else {
		    Call("http://"+ipmas[tip_stop]+"/stop"); }}
    return false; }
function TestPreset(p) { var s=document.getElementById(p).value;var m=document.getElementById("length").value;if (Number(s)>Number(m)) { s=m; document.getElementById(p).value=s; } StepsOvr(s); return false; }
function SetPreset(p) { document.getElementById(p).value = document.getElementById("pos").innerHTML; }

function Test(dir)
{
document.getElementById("btn_up").disabled=true;
document.getElementById("btn_dn").disabled=true;
pinout=document.getElementById("pinout").value;
reversed=document.getElementById("reversed").value;
delay=document.getElementById("delay").value;
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
if (this.readyState == 4 && this.status == 200) {
document.getElementById("btn_up").disabled=false;
document.getElementById("btn_dn").disabled=false;
document.getElementById("pos").innerHTML=this.responseText;
document.getElementById("dest").innerHTML=this.responseText;
	}};
url="test?pinout="+pinout+"&reversed="+reversed+"&delay="+delay;
if (dir==1) url=url+"&up=1"; else url=url+"&down=1";
xhttp.open("GET", url, true);
xhttp.send();
}
function TestUp() { Test(1); }
function TestDown() { Test(0); }


function PinChange() {
var slave=document.getElementById('slave');
var btn_pin=document.getElementById('btn_pin');
var aux_pin=document.getElementById('aux_pin');
if (!slave || !btn_pin || !aux_pin) return;
if (aux_pin.selectedIndex == btn_pin.selectedIndex) aux_pin.selectedIndex=0;
var op = btn_pin.getElementsByTagName("option");
for (var i = 1; i < op.length; i++) op[i].disabled = (i == aux_pin.selectedIndex);
op = aux_pin.getElementsByTagName("option");
for (var i = 1; i < op.length; i++) op[i].disabled = (i == btn_pin.selectedIndex);

if (slave.selectedIndex > 1) 
{
document.getElementById('pin_RX').disabled = true;
document.getElementById('aux_RX').disabled = true;
}

var dis = false;
if (btn_pin.options[btn_pin.selectedIndex].id == 'pin_RX') dis = true;
if (aux_pin.options[aux_pin.selectedIndex].id == 'aux_RX') dis = true;
var op = document.getElementById('slave').getElementsByTagName("option");
for (var i = 2; i < op.length; i++) op[i].disabled = dis;
}

//                                                                                                          новые функции

function readyDOMmain(){                                                  // добавляем блоки на главной странице для управления каждым ведомым по http, в скрытых div храним значения Now и Max чтобы считать процент открытия из них
  if (ipmas[0].length>2) { for (let key in ipmas){
    newlist = document.getElementById("main");
    sec = document.createElement("section");
    sec.id = "mainip-"+key;
	sec.classList.add("mainip");
    sec.innerHTML = '<div style="width:100%;display:flex;"><p1 id="mainip_name-'+key+'" style="width:45%;">----</p1><p1 id="mainip_proc-'+key+'" style="width:8%;text-align: center;">----</p1>'+
                    '<p1 id="mainip_ip-'+key+'" style="width:47%;text-align: right;">'+ipmas[key]+'</p1></div><ul><li class="menuopen"><a href="open" onclick="return Open('+key+');"><div class="svg"></div></a></li>'+
                    '<li class="menustop"><a href="stop" onclick="return Stop('+key+');"><div class="svg"></div></a></li><li class="menuclose"><a href="close" onclick="return Close('+key+');"><div class="svg"></div></a></li></ul>';
    newlist.parentNode.insertBefore(sec, newlist.nextSibling);
                      // лень было делать функцию вместо функции st(...) в GetStatus(). st() сохраняет в элемент html, поэтому скрытые элементы. Так-то можно было вместо st, своей функцией сохранять сразу в переменную, тогда следующие строки былибы не нужны
	tr = document.createElement("div");
	tr.style = "display: none;";
	tr.id = "ipnow-"+key;
	document.getElementById("ip-http").after(tr);
	tr = document.createElement("div");
	tr.style = "display: none;";
	tr.id = "ipmax-"+key;
	document.getElementById("ip-http").after(tr);
    }
  }
}

function readyDOMsettings(){                                                  // добавляем строки в Settings вместе с кнопкой Удалить для кождого IP из массива
  if (ipmas[0].length>2) { for (let key in ipmas){
    newrow = document.getElementById("ip_add");
    tr = document.createElement("tr");
    tr.id = "row_ip-"+key;
    tr.innerHTML = '<td><input id="btn_del_ip-'+key+'" type="button" name="del" value="Удалить" onclick="DelIP('+key+')"></td><td style="display: inline-table"><label style="width: 130px;display: inline-block;">'+
                   ipmas[key]+'</label></td>';
    newrow.parentNode.insertBefore(tr, newrow.nextSibling);
    }
  }
}

function DelallIp(){                                    // Удаление всех строк для функции DelIP
  for (var key in ipmas){
  delrow = document.getElementById("row_ip-"+key);
  pardelrow = delrow.parentNode;
  pardelrow.removeChild(delrow);
  }
}

function DelIP(numdelkey){                          // Если нажата кнопка Удалить IP, то удаляем Все строки и создаем оставшиеся заново с новой нумерацией по порядку. Грубо, но избегаем вычисление удаляемого элемента и перестройку DOM. 
  DelallIp();
  ipmas.splice(numdelkey, 1);                                             
  document.getElementById("ip_http").value = ipmas+"";
  readyDOMsettings();
}

function AddIP(r_ip1,r_ip2,r_ip3,r_ip4){                                   // добавление IP
                                                             // проверка на вшивость IP - если не число или число не в диапазоне то закрасим красным
  document.mainform.remip1.style.background="white";
  document.mainform.remip2.style.background="white";
  document.mainform.remip3.style.background="white";
  document.mainform.remip4.style.background="white";
  if (!(r_ip1>0 & r_ip1<255)) {document.mainform.remip1.style.background="red";} else{ 
    if (!(r_ip2>0 & r_ip2<255)) {document.mainform.remip2.style.background="red";} else{
      if (!(r_ip3>0 & r_ip3<255)) {document.mainform.remip3.style.background="red";} else{
        if (!(r_ip4>0 & r_ip4<255)) {document.mainform.remip4.style.background="red";} else{
                                                              //если проверку прошли то запись в массив ip и в скрытый элемент блока упр по http, при нажатии кнопки сохранить в Settings от туда возьмем для сохранения во флеш
          if (ipmas[0].length>2) {DelallIp();}
		  r_ip_all = parseInt(r_ip1, 10)+"."+parseInt(r_ip2, 10)+"."+parseInt(r_ip3, 10)+"."+parseInt(r_ip4, 10);
	      if (ipmas[0].length<2) {ipmas[0] = r_ip_all;} else {ipmas.push(r_ip_all)};
	      document.mainform.all_ip_remote.value = ipmas+"";
		  readyDOMsettings();
        }
	  }
	}
  }
}   

