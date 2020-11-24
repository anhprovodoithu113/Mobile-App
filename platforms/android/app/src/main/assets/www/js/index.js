/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

var db;
function onDeviceReady() {
    // Cordova is now initialized. Have fun!

//    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
//    document.getElementById('deviceready').classList.add('ready');
//    db = window.openDatabase("Database", "1.0", "IRating", 2*1024*1024);
    db = window.sqlitePlugin.openDatabase({name:'IRating', location: 'default',});
    db.transaction(createDB, errorDB, successDB);
}

function createDB(tx){
    tx.executeSql('CREATE TABLE IF NOT EXISTS RATINGFORM (id unique, resName, resType, visitedTime, price, service, cleanliness, foodQuality, notes, username)');
}

window.addEventListener('load', onBodyLoad);

function onBodyLoad(){
    var resTypeArray = ["Grill", "Sea food", "Fast food"];
    $('#information-detail').html('');
    resTypeArray.forEach(function(item, index){
        var sql = 'SELECT id, resName, resType, count(username) as reports FROM RATINGFORM WHERE resType == "'+item+'" GROUP BY resName';
        db.transaction(function(tx){
            tx.executeSql(sql, [], function(tx, rs){
                var count = 1;
                var length = rs.rows.length;
                while(count <= length){
                    var resName = rs.rows.item(count - 1).resName;
                    var number = rs.rows.item(count-1).id;
                    var countReports = rs.rows.item(count-1).reports;

                    var service = getListRating(resName, 'service', number);
                    var cleanliness = getListRating(resName, 'cleanliness', number);
                    var foodQuality = getListRating(resName, 'foodQuality', number);
                    var average = ((service + cleanliness + foodQuality) / 3).toFixed(2);


                    var html = '<li><a href="#" onclick=viewDetail('+number+')><span>' + resName +'</span> <p>Res type: '+item+'</p> <span>Rating: '+ average +'</span> <span class="ui-li-count">'+ countReports +'</span></a></li>';
                    window.localStorage.setItem('nameDb_'+number, resName);
                    window.localStorage.setItem('typeDb_'+number, item);

//                    var html = '<div style="background-color:#f2f2f2; padding: 2px;">' +
//                    '<div><p><b>N0:</b> '+ number + '</p></div>' +
//                    '<div><p><b>RESTAURANT TYPE:</b> ' + rs.rows.item(count - 1).resType + '</p></div>' +
//                    '<div><p><b>RESTAURANT NAME:</b> ' + resName + '</p></div>' +
//                    '<div><p><b>RATING:</b> ' + ((service + cleanliness + foodQuality)/3).toFixed(2) + '</p></div>' +
//                    '<div><p><b>REPORTS:</b> ' + rs.rows.item(count-1).reports + '</p></div>' +
//                    '<div><button onclick="viewDetail('+ rs.rows.item(count-1).id +')" >View more...</button>'
//                    '</div><p></p>';
                    $('#information-detail').append(html).listview('refresh');
                    count++;
                    number++;
                }
            });
        }, function(err){alert(err);}, function(){ });
    });
}

function viewDetail(id){
    var name = window.localStorage.getItem('nameDb_'+id);
    var type = window.localStorage.getItem('typeDb_'+id);
    $.mobile.changePage('detailRestaurant.html', {dataUrl: 'detailRestaurant.html?parameter="123"&&type="Grill"', data:{'parameter' : name, 'type': type},  reloadPage : true, changeHash : true});
}

$(document).on('pagebeforeshow', '#detailRestaurant', function(){
   var parameters = $(this).data("url").split("?")[1];
   console.log(parameters);
   var type = parameters.split('&')[1].replace("type=","");
   if(type.indexOf('+') > 0){
        type = type.replace('+', ' ');
   }
   var name = parameters.split('&')[0].replace("parameter=", "");
   var number = 1;
   $('#analyseRestaurant').html('');
   var sql = 'SELECT * FROM RATINGFORM WHERE resName = "' + String(name) + '" And resType = "'+ String(type) + '"';
   console.log(sql);
   $('#myResName').text(name);
   db.transaction(function(tx){
       tx.executeSql(sql, [], function(tx, rs){
        var count = 1;
        var length = rs.rows.length;
        while(count <= length){
            var service = getRating(rs.rows.item(count-1).id, name, 'service');
            var cleanliness = getRating(rs.rows.item(count-1).id, name, 'cleanliness');
            var foodQuality = getRating(rs.rows.item(count-1).id, name, 'foodQuality');
            var average = ((service + cleanliness + foodQuality) / 3).toFixed(2);
            var html = '<div style="background-color:#f2f2f2; padding: 2px;">' +
            '<div><p><b>N0:</b> '+ number + '</p></div>' +
            '<div><p><b>RESTAURANT TYPE:</b> ' + rs.rows.item(count - 1).resType + '</p></div>' +
            '<div><p><b>VISITED TIME:</b> ' + rs.rows.item(count - 1).visitedTime + '</p></div>' +
            '<div><p><b>PRICE (PER PERSON):</b> $' + rs.rows.item(count - 1).price + '</p></div>' +
            '<div><p><b>RATING:</b> ' + average +'</p></div>' +
            '<div><p><b>NOTES:</b> ' + rs.rows.item(count-1).notes +'</p></div>' +
            '<div><p><b>REPORTER:</b> ' + rs.rows.item(count-1).username + '</p></div>' +
            '<div><button onclick="editItem('+ rs.rows.item(count-1).id +')" >EDIT</button>' +
            '<button onclick="deleteItem('+ rs.rows.item(count-1).id +')" >DELETE</button>'
            '</div><p></p>';
            $('#analyseRestaurant').append(html);
            count++;
            number++;
        }
       });
   }, function(err){alert('Error: ' + err);}, function(){});
});

function deleteItem(id){
    navigator.notification.confirm('Do you want to delete this data', function(index){
        if(index == 1){
            var sql = 'DELETE FROM RATINGFORM WHERE id ="' + id +'"';
            db.transaction(function(tx){
                tx.executeSql(sql, []);
            }, function(err){alert('Error: ' + err);}, function(){
                onBodyLoad(); $.mobile.changePage('index.html');
            });
        }
    }, 'Warning', ['Yes', 'No']);
}

function editItem(id){
    $.mobile.changePage('inputForm.html', { dataUrl : "inputForm.html?parameter=123", data : { 'parameter' : id }});
}

function getListRating(resName, object, id){
    var sql = 'SELECT ' + object + ' as service FROM RATINGFORM WHERE resName == "' + resName + '"';
    var count = 0;
    var total = 0;
    var tempTotal = 0;
    db.transaction(function(tx){
        tx.executeSql(sql, [], function(tx, rs){
            var length = rs.rows.length;
            while(count < length){
                if(rs.rows.item(count).service == 'Need to improve'){
                    total += 1;
                }else if(rs.rows.item(count).service == 'OKAY'){
                    total += 2;
                } else if (rs.rows.item(count).service == 'GOOD'){
                    total += 3;
                } else if (rs.rows.item(count).service == 'Excellent'){
                    total += 4;
                }
                count++;
            }
            tempTotal = total/length;
            window.localStorage.setItem(object + '_' + id, tempTotal);
        });
    });
    var result = parseInt(window.localStorage.getItem(object + '_' + id));
    console.log(result);
    return result;
}

function getRating(id, resName, object){
    var sql = 'SELECT '+ object + ' as service FROM RATINGFORM WHERE id = "'+ id + '"';
    db.transaction(function(tx){
        tx.executeSql(sql, [], function(tx, rs){
            var total = 0;
            if(rs.rows.item(0).service == 'Need to improve'){
                total += 1;
            } else if(rs.rows.item(0).service == 'OKAY'){
                total += 2;
            } else if (rs.rows.item(0).service == 'GOOD'){
                total += 3;
            } else if (rs.rows.item(0).service == 'Excellent'){
                total += 4;
            }
            window.localStorage.setItem(resName + '_' + object + '_' + id, total);
            console.log(total);
        });
    });
    var result = parseInt(window.localStorage.getItem(resName + '_' + object + '_' + id));
    console.log(result);
    return result;
}

function errorDB(err){
    alert('Error: ' + err);
}

function successDB(){
    alert('Connection successful!');
}

function successQueryDB(){
    alert('success querying!');
}

$('#inputNewForm').on('tap', function(){
    $.mobile.changePage('inputForm.html');
})
//$(document).on('pagebeforeshow', '#homepage', function(){
//    var sql = 'SELECT resName, count(username) FROM RATINGFORM GROUP BY resName';
//    db.transaction(function(tx){
//        tx.executeSql(sql, [], function(tx, rs){
//            console.log(rs.rows);
//        });
//    }, function(err){alert('err');}, function(){alert('succ');});
//});

$(document).on('pagebeforeshow', '#resultPage', function(){
    var resName = window.localStorage.getItem('resName');
    var visitedTime = window.localStorage.getItem('visitedTime');
    var price = window.localStorage.getItem('price');
    var resType = window.localStorage.getItem('resType');
    var username = window.localStorage.getItem('username');
    var service = window.localStorage.getItem('service');
    var cleanliness = window.localStorage.getItem('cleanliness');
    var foodQuality = window.localStorage.getItem('foodQuality');
    var notes = window.localStorage.getItem('notes');

    var html = '<div><p><b>Restaurant name:<b>' +
                '<span> '+ resName +'</span></p></div>' +
                '<div><p><b>Restaurant type:<b>' +
                '<span> '+ resType +'</span></p></div>' +
                '<div><p><b>Visited Time:<b>' +
                '<span> '+ visitedTime +'</span></p></div>' +
                '<div><p><b>Price:<b>' +
                '<span> $'+ price +'</span></p></div>' +
                '<div><p><b>Service:<b>' +
                '<span> '+ service +'</span></p></div>' +
                '<div><p><b>Cleanliness rating:<b>' +
                '<span> '+ cleanliness +'</span></p></div>' +
                '<div><p><b>Food quality rating:<b>' +
                '<span> '+ foodQuality +'</span></p></div>' +
                '<div><p><b>Notes:<b>' +
                '<span> '+ notes +'</span></p></div>' +
                '<div><p><b>Reporter:<b>' +
                '<span> '+ username +'</span></p></div>';
    $('#specificData').html(html);

    $('#editButton').on('tap', function(){
        $.mobile.changePage('inputForm.html');
    });
    var parameters = $(this).data("url");
    $('#acceptButton').on('tap', function(){
        var id = '';
        if(parameters != null){
            parameters = parameters.split("?")[1];
            var parameter = parameters.replace("parameter=","");
            var sql = 'UPDATE RATINGFORM SET resName=?, resType=?, visitedTime=?, price=?, service=?, cleanliness=?, foodQuality=?, notes=?, username=? WHERE id=?';
            db.transaction(function(tx){
                tx.executeSql(sql, [resName, resType, visitedTime, price, service, cleanliness, foodQuality, notes, username, parameter]);
            }, function(err){alert(err);}, function(){
                onBodyLoad();
                $.mobile.changePage('index.html');
            });
        } else{
            db.transaction(function(tx){
                tx.executeSql('SELECT count(*) as myCount FROM RATINGFORM', [], function(tx, rs){
                        id = rs.rows.item(0).myCount + 1;
                        window.localStorage.setItem('id', id);
                });
            });

            sql = 'INSERT INTO RATINGFORM (id, resName, resType, visitedTime, price, service, cleanliness, foodQuality, notes, username)'
            + 'VALUES (?,?,?,?,?,?,?,?,?,?)';
            db.transaction(function(tx){
                id = window.localStorage.getItem('id');
                tx.executeSql(sql, [id, resName, resType, visitedTime, price, service, cleanliness, foodQuality, notes, username]);
                }, function(error){
                    alert('Error');
                }, function(){
                    onBodyLoad();
                    $.mobile.changePage('index.html');
            });
        }
    });
});

//$(document).on('pagebeforeshow', '#homepage', function(){
//    UpdateData(db);
//});

$(document).on('pagebeforeshow', '#inputFormPage', function(){
    var parameters = $(this).data("url");
    parameters = parameters.split("?")[1];
    var id = null;
    if(parameters != undefined){
        var parameter = parameters.replace("parameter=","");
        id = parameter;
        var sql = 'SELECT * FROM RATINGFORM WHERE id = "' + parameter + '"';
        db.transaction(function(tx){
           tx.executeSql(sql, [], function(tx, rs){
           $('#price').val(rs.rows.item(0).price);
           $('#name').val(rs.rows.item(0).username);
            $('#resName').val(rs.rows.item(0).resName);
            $('#date').val(rs.rows.item(0).visitedTime);
            $('#resType').val(rs.rows.item(0).resType).change();
            $('input[name="radio-choice-w-0"]').filter('[value="'+ rs.rows.item(0).service +'"]').prop('checked', 'checked').click();
            $('input[name="radio-choice-w-1"]').filter('[value="'+ rs.rows.item(0).cleanliness +'"]').prop('checked', 'checked').click();
            $('input[name="radio-choice-w-2"]').filter('[value="'+ rs.rows.item(0).foodQuality +'"]').prop('checked', 'checked').click();
            $('#notes').val(rs.rows.items(0).notes);
           });
        });
    }
    $('#submit').on('tap', function(){
        var resName = $('#resName').val();
        var visitedTime = $('#date').val();
        var price = $('#price').val();
        var resType = $('#resType').children('option:selected').val();
        var username = $('#name').val();
        var service = $('input[name="radio-choice-w-0"]:checked').val();
        var cleanliness = $('input[name="radio-choice-w-1"]:checked').val();
        var foodQuality = $('input[name="radio-choice-w-2"]:checked').val();
        var notes = $('#notes').val();

        if(resName == ''){
            customMessage('Please input restaurant name');
        } else if(visitedTime ==''){
            customMessage('Please input date and time you visited');
        } else if(price ==''){
            customMessage('Please input the meal\'s price for each person');
        } else if(username ==''){
            customMessage('Please input your name');
        } else{
            window.localStorage.setItem('resName', resName);
            window.localStorage.setItem('resType', resType);
            window.localStorage.setItem('visitedTime', visitedTime);
            window.localStorage.setItem('price', price);
            window.localStorage.setItem('username', username);
            window.localStorage.setItem('service',service);
            window.localStorage.setItem('cleanliness', cleanliness);
            window.localStorage.setItem('foodQuality', foodQuality);
            window.localStorage.setItem('notes', notes);
            if(id != null){
                $.mobile.changePage('resultPage.html', { dataUrl : "inputForm.html?parameter=123", data : { 'parameter' : id }});
            } else{
                $.mobile.changePage('resultPage.html');
            }
        }
    });
});

function customMessage(message){
    $.mobile.toast({
            message: message,
            duration: 3000,
            classOnOpen:'animated bounceInUp'
    });
}