let url = 'https://api.upbit.com/v1/market/all';
let markets = [];
let krw_market_list = [];
let krw_market_list2 = {};
let url_list = [];
let coin_price_data = [];

function wait(ms) {
  var d = new Date();
  var d2 = null;
  do {
    d2 = new Date();
  }
  while (d2 - d < ms);
}

$(document).ready(function () {
  let request = new XMLHttpRequest();
  request.open('GET', url, false);
  request.onload = function () {

    let data = JSON.parse(this.response);
    if (request.status >= 200 && request.status < 400) {
      data.forEach(function (element) {
        if (element['market'].slice(0, 3) === 'KRW') {
          markets.push(element);
        }
      });
    }

    // make url list for yesterday price
    markets.forEach(function (element) {
      krw_market_list.push(element['market']);
      krw_market_list2[element['market']] = element['korean_name'];
      url_list.push('https://api.upbit.com/v1/candles/days?market=' + element['market'] + '&count=2');
    });
  };
  request.send();

  url_list.forEach(function (element) {
    wait(30);
    let request2 = new XMLHttpRequest();
    request2.open('GET', element, false);
    request2.onreadystatechange = function () {
      if (request2.readyState !== 4) return;
      if (request2.status >= 200 && request2.status < 300) {
        let data2 = JSON.parse(this.response);
        coin_price_data.push(
            {
              'market_name': krw_market_list2[data2[1]['market']],
              'y_high_price': data2[1]['high_price'],
              'y_low_price': data2[1]['low_price'],
              'opening_price': data2[0]['opening_price'],
              'current_price': data2[0]['trade_price'],
              'target_price': data2[0]['opening_price'] + (data2[1]['high_price'] - data2[1]['low_price']) * 0.6,
              'diff' : (data2[0]['opening_price'] + (data2[1]['high_price'] - data2[1]['low_price']) * 0.6) - data2[0]['trade_price'],
              'diff_percentage' : data2[0]['trade_price']/(data2[0]['opening_price'] + (data2[1]['high_price'] - data2[1]['low_price']) * 0.6)
            });
        //console.log(data2[0]);
      } else {
        console.log("error");
      }
    };
    request2.send();
  });



  google.charts.load('current', {'packages':['table']});
  google.charts.setOnLoadCallback(drawTable);

  function drawTable() {

    var cssClassNames = {
      'headerRow': 'grey-background'
    };

    var data = new google.visualization.DataTable();
    data.addColumn('string', '코인');
    data.addColumn('number', '전일고가');
    data.addColumn('number', '전일저가');
    data.addColumn('number', '시가');
    data.addColumn('number', '현재가');
    data.addColumn('number', '목표가');
    data.addColumn('number', '목표가와 차이');
    data.addColumn('number', '현재가/목표가')

    let table_content = [];
    coin_price_data.forEach(function (element) {
      let temp = [];
      temp.push(element['market_name']);
      temp.push({v: element['y_high_price'], f: element['y_high_price'].toFixed(3)});
      temp.push({v: element['y_low_price'], f: element['y_low_price'].toFixed(3)});
      temp.push({v: element['opening_price'], f: element['opening_price'].toFixed(3)});
      temp.push({v: element['current_price'], f: element['current_price'].toFixed(3)});
      temp.push({v: element['target_price'], f: element['target_price'].toFixed(3)});
      temp.push({v: element['diff'], f: element['diff'].toFixed(3)});
      temp.push({v: element['diff_percentage'], f: element['diff_percentage'].toFixed(3)});
      table_content.push(temp);
    });
    data.addRows(table_content);

    var table = new google.visualization.Table(document.getElementById('table_div'));
    table.draw(data, {showRowNumber: false,
                      width: '100%',
                      height: '100%',
                      'cssClassNames': cssClassNames,
                      sortAscending: false,
                      sortColumn: 7 });
  }
});