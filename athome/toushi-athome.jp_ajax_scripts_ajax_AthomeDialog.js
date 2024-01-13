/*
 * ダイアログ表示クラス
 */
var AthomeDialog = function(){

	// ダイアログのチェック選択数
	this.select_count = 0;
	// 検索方法選択ダイアログから遷移したフラグ
	this.from_selectdown = false;
	// 町村フラグ
	this.choson = false;
	// SCバナー取得再実行フラグ
	this.scBannerRetry = false;
	// ダイレクト検索フラグ
	this.direct = false;

	this.initialize();
}

AthomeDialog.prototype = {

	/*
	 * コンストラクタ
	 */
	initialize: function() {
		this.selectInit();
	},

	/*
	 * 初期検索方法切替
	 */
	selectInit: function() {
		var $J_search_list = $('#search_list');
		var $J_search_list_DOWN_val = $J_search_list.children('#DOWN').val();

		List.top = true;

		if ($J_search_list.children('#CHOSON').val() != '') {
			this.choson = true;
		}

		if ($J_search_list.children('#SPCD').val() == '') {
			if ($J_search_list_DOWN_val == '1' && $J_search_list.children('#SHIKU').val() != '') {
				// 市区ダイレクト検索
				List.search = 'shiku';
				List.getList();
			} else if ($J_search_list_DOWN_val == '2' && $J_search_list.children('#EKI').val() != '') {
				// 沿線ダイレクト検索
				List.search = 'eki';
				List.getList();
			} else if ($J_search_list_DOWN_val == '3' && $J_search_list.children('#stationname').val() != '' && $J_search_list.children('#time').val() != '' && $J_search_list.children('#transfer').val() != '' && $J_search_list.children('#option').val() != '') {
				// 所要時間ダイレクト検索
				List.search = 'time';
				List.getList();
			} else if ($J_search_list_DOWN_val == '4' && $J_search_list.children('#LAT').val() != '' && $J_search_list.children('#LON').val() != '') {
				// 地図ダイレクト検索
				this.direct = true;
				this.selectMapShiku();
			} else if ($J_search_list_DOWN_val == '5' && $J_search_list.children('#VEKI').val() != '') {
				// 路線図ダイレクト検索
				List.search = 'rosen';
				List.getList();
			} else if ($J_search_list_DOWN_val == '12') {
				// 特集ダイレクト検索
				List.getList();
			} else {
				// ダイアログ表示
				var eki = ($J_search_list.children('#ENSEN').val() != '') ? true : false;
				this.selectDialog('', eki);
			}
		} else {
			if ($J_search_list_DOWN_val == '4' && $J_search_list.children('#LAT').val() != '' && $J_search_list.children('#LON').val() != '') {
				// 地図ダイレクト検索
				this.direct = true;
				this.selectMapShiku();
			} else {
				// 特集の場合、ダイレクト検索のみ
				List.getList();
			}
		}
	},

	/*
	 * ダイアログ表示
	 */
	selectDialog: function(down, eki, back) {

		// item がrs ならリゾートへ遷移
		if ( $('#ITEM').val() == "rs" ) {
			List.getList();
			return;
		}
		// 県コードが指定されないと県選択表示
		// 47のときは県コードが無くても AT=0 があれば県選択は表示しない
		var $J_search_list = $('#search_list');
		if ($J_search_list.children('#KEN').val() == '' && $J_search_list.children('#HIDDEN_KEN').val() == '' && $J_search_list.children('#AT').val() == '') {
			this.selectKen();
			return;
		}

		// ダイアログ表示
		if (typeof(down) == 'undefined' || down == '') {
			down = $J_search_list.children('#DOWN').val();
		}
		$J_search_list.children('#DOWN').val(down);

		var kind = '';
		switch (down) {
			case '1': // 市区
				this.selectShiku();
				break;
			case '2': // 沿線
				if (eki) {
					this.selectEki();
				} else {
					this.selectEnsen();
				}
				break;
			case '3': // 所要時間
				this.selectTime();
				break;
			case '4': // 地図
				this.selectMapShiku();
				break;
			case '5': // 路線図
				this.selectRosen();
				break;
			default : // 検索方法選択
				this.selectDown();
				break;
		}
	},

	/*
	 * ダイアログ初期表示用検索パラメータ生成
	 */
	getDialogParam: function(list) {
		var param = '';
		var $J_search_list = $('#search_list');

		$.each(list,function(idx,val){
			var _val = Common.escapeBracket(val);
			var name = $J_search_list.children('#' + _val).attr('name');
			// 裏もちパラメータは通常のパラメータ名に戻す
			if (name.match(/HIDDEN_/)) {
				name = name.replace('HIDDEN_', '');
			}
			var value = $J_search_list.children('#' + _val).val();
			// 駅のときは沿線駅コードから沿線を削除
			if (name == 'EKI') {
				var eki_list = new Array();
				var eki = value.split(',');

				$.each(eki,function(idx,val){
					var eki = val.split('_');
					eki_list.push(eki[1]);
				});

				eki_list.join(',');
				value = eki_list;
			}
			if (value != '') { // 値が空は除外
				param += '&' + name + '=' + value;
			}

		});

		var elem = $J_search_list.find('input , select, textarea');

		$.each(elem,function(idx,val){
			if (val.type != 'hidden') {
				if (val.type == 'select-one' || $(val).is(':checked')) {
					param += '&' + val.name + '=' + val.value;
				}
			}
		});

		if (List.top) {
			param += '&TOP=1';
		}

		return param;
	},

	/*
	 * 検索方法選択ダイアログ表示
	 */
	selectDown: function() {
		var list = new Array('SITECD', 'ITEM', 'ART');
		var param = this.getDialogParam(list);
		this.showDialog(DIALOG_DOWN_URL, param, 'down');
	},

	/*
	 * 都道府県選択ダイアログ表示
	 */
	selectKen: function() {
		var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN');
		var param = this.getDialogParam(list);
		this.showDialog(DIALOG_KEN_URL, param, 'ken');
	},

	/*
	 * 市区郡選択ダイアログ表示
	 */
	selectShiku: function(s) {
		var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', 'AREA', 'KEN');
		var param = this.getDialogParam(list);
		var sort = (typeof(s) != 'undefined') ? s : '1';
		param += '&SORT=' + sort
		this.showDialog(DIALOG_SHIKU_URL, param, 'shiku');
	},

	/*
	 * 町村選択ダイアログ表示
	 */
	selectChoson: function() {
		var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', 'AREA', 'KEN', 'SHIKU');
		var param = this.getDialogParam(list);
		this.showDialog(DIALOG_CHOSON_URL, param, 'choson');
	},

	/*
	 * 沿線選択ダイアログ表示
	 */
	selectEnsen: function() {
		var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', 'AREA', 'KEN');
		var param = this.getDialogParam(list);
		this.showDialog(DIALOG_ENSEN_URL, param, 'ensen');
	},

	/*
	 * 駅選択ダイアログ表示
	 */
	selectEki: function() {
		var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', 'AREA', 'KEN', 'ENSEN');
		var param = this.getDialogParam(list);
		this.showDialog(DIALOG_EKI_URL, param, 'eki');
	},

	/*
	 * 所要時間選択ダイアログ表示
	 */
	selectTime: function() {
		//路線図検索の場合、val研からjavascript をimport
		//既に読み込まれていないかのチェック
		var scriptTotal = document.getElementsByTagName("script");
		var valKenFlg = 0;
		for ( var i=0; i<scriptTotal.length; i++ ) {
			if ( scriptTotal[i].src.indexOf("expmapinclude") != -1 ) {
				valKenFlg = 1;
				break;
			}
		}
		//読み込まれていなければ、val研からjavascript をimport
		if (valKenFlg == 0) {
			var valKey = this.getValApiKey();
			$.getScript('https://asp.ekispert.jp/expapi/expmapinclude?key='+valKey, $.proxy(function(){
				var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', 'AREA', 'KEN');
				var param = this.getDialogParam(list);
				this.showDialog(DIALOG_TIME_URL, param, 'time',680);
			},this));
		}else{
			var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', 'AREA', 'KEN');
			var param = this.getDialogParam(list);
			this.showDialog(DIALOG_TIME_URL, param, 'time',680);
		}

	},

	/*
	 * 所要時間隣接駅を変更ダイアログ表示
	 */
	selectRinsetsu: function() {
		var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', 'AREA', 'KEN', 'stationname' ,'time' ,'transfer' ,'option');
		var param = this.getDialogParam(list);
		this.showDialog(DIALOG_RINSETSU_URL, param, 'rinsetsu');
	},

	/*
	 * 地図用市区郡選択ダイアログ表示
	 */
	selectMapShiku: function() {
		this.googleLoad();
	},
	/*
	 * GoogleAPIロード
	 */
	googleLoad: function() {
		var google_params ="";
		var google_version ="quarterly";
		if($('#google_params').val() !=""){
			google_params = '&' + $('#google_params').val();
		}
		if($('#google_version').val() !=""){
			google_version = $('#google_version').val();
		}
		var mapsFlg = 0;
		var scriptTotal = document.getElementsByTagName("script");
		for ( var i=0; i<scriptTotal.length; i++ ) {
			if ( scriptTotal[i].src.indexOf("maps.google.com\/maps") != -1 ) {
				mapsFlg = 1;
				break;
			}
			if ( scriptTotal[i].src.indexOf("maps.googleapis.com\/maps") != -1 ) {
				mapsFlg = 1;
				break;
			}
		}
		if ( mapsFlg == 0 ) {
			$.getScript('https://maps.google.com/maps/api/js?v=' + google_version + '&libraries=place' + google_params, $.proxy(function(){
				mapsLoad();
			},this));
		}else{
			mapsLoad();
		}

		function mapsLoad() {
			$J_search_list = $('#search_list');

			// ダイレクト検索
			if (Dialog.direct) {
				List.search = 'map';
				OurMap.clickCity($J_search_list.children('#LAT').val(), $J_search_list.children('#LON').val());
				Dialog.direct = false;
			// クリッカブルマップ表示
			} else {
				// AREA、KENが無いときは裏もちパラメータを設定
				var area = ($J_search_list.children('#AREA').val() != '') ? 'AREA' : 'HIDDEN_AREA';
				var ken = ($J_search_list.children('#KEN').val() != '') ? 'KEN' : 'HIDDEN_KEN';
				var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', area, ken);
				var param = Dialog.getDialogParam(list);

				if ($J_search_list.children('#GAZO_ID').val() != 'undefined') {
					param += '&GAZO_ID=' + $J_search_list.children('#GAZO_ID').val();
				}

				Dialog.showDialog(DIALOG_MAP_SHIKU_URL, param, 'mapshiku');
				$J_search_list.children('#GAZO_ID').val('');
			}
		}
	},
	/*
	 * 路線図選択ダイアログ表示
	 */
	selectRosen: function() {
		//路線図検索の場合、val研からjavascript をimport
		//既に読み込まれていないかのチェック
		var scriptTotal = document.getElementsByTagName("script");
		var valKenFlg = 0;
		for ( var i=0; i<scriptTotal.length; i++ ) {
			if ( scriptTotal[i].src.indexOf("expmapinclude") != -1 ) {
				valKenFlg = 1;
				break;
			}
		}
		//読み込まれていなければ、val研からjavascript をimport
		if ( valKenFlg == 0 ) {
			var valKey = this.getValApiKey();
			$.getScript('https://asp.ekispert.jp/expapi/expmapinclude?key='+valKey, $.proxy(function(){
				// AREA、KENが無いときは裏もちパラメータを設定
				var area = ($('#search_list').children('#AREA').val() != '') ? 'AREA' : 'HIDDEN_AREA';
				var ken = ($('#search_list').children('#KEN').val() != '') ? 'KEN' : 'HIDDEN_KEN';
				var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', area, ken);
				var param = this.getDialogParam(list);
				this.showDialog(DIALOG_ROSEN_URL, param, 'rosen',900);
			},this));
		}else{
			// AREA、KENが無いときは裏もちパラメータを設定
			var area = ($('#search_list').children('#AREA').val() != '') ? 'AREA' : 'HIDDEN_AREA';
			var ken = ($('#search_list').children('#KEN').val() != '') ? 'KEN' : 'HIDDEN_KEN';
			var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', area, ken);
			var param = this.getDialogParam(list);
			this.showDialog(DIALOG_ROSEN_URL, param, 'rosen',900);

		}

	},

	/*
	 * リゾートエリア選択ダイアログ表示
	 */
	selectResortArea: function() {
		var list = new Array('SITECD', 'ITEM');
		var param = this.getDialogParam(list);
		this.showDialog(DIALOG_RESORT_AREA_URL, param, 'resortarea');
	},

	/*
	 * リゾート種目選択ダイアログ表示
	 */
	selectResortShumoku: function() {
		var list = new Array('SITECD', 'ITEM', 'ART', 'AREA', 'RESORT');
		var param = this.getDialogParam(list);
		this.showDialog(DIALOG_RESORT_SHUMOKU_URL, param, 'resort');
	},

	/*
	 * 検索条件ダイアログ表示
	 */
	selectJoken: function() {
		var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', 'AREA', 'KEN');
		if (List.search != "time" ) {
			list.push(List.search.toUpperCase());
		} else {
			list.push('stationname', 'time', 'transfer', 'option');
		}
		var param = this.getDialogParam(list);
		param += '&CLVMODE=0';
		param += '&DIALOG=1';

		this.showDialog(DIALOG_JOKEN_URL, param, 'joken');
	},

	/*
	 * こだわり条件ダイアログ表示
	 */
	selectKodawari: function() {
		var list = new Array('SITECD', 'SPCD', 'ITEM', 'ART', 'DOWN', 'AREA', 'KEN');
		switch ($('#search_list').children('#DOWN').val()) {
			case '1': list.push('SHIKU','CHOSON'); break;											// 市区
			case '2': list.push('EKI'); break;												// 沿線
			case '3': list.push('stationname', 'time', 'transfer', 'option'); break;		// 所要時間
			case '4': list.push('LATMIN', 'LATMAX', 'LONMIN', 'LONMAX', 'SCALE'); break;	// 地図
			case '5': list.push('VEKI'); break;												// 路線図
		}

		var param = this.getDialogParam(list);
		param += '&CLVMODE=2';
		param += '&DIALOG=1';
		this.showDialog(DIALOG_JOKEN_URL, param, 'kodawari');
	},

	/*
	 * ダイアログ表示
	 */
	showDialog: function(url, param, type) {
		// 一覧取得が動いていれば中止
		List.abortHttpRequest();

		if (typeof(type) != 'undefined') List.search = type;

		if (List.top) {
			scrollTo(0,0);
			List.scBanner = true;
		} else {
			if (List.search != 'kodawari') {
				List.scBanner = true;
			}
		}

		Common.hideLoading('large');

		// ダイアログ閉じる
		this.hideDialog();

		// ローディング画像、半透明表示
		Common.showOverlay();
		Common.showLoading('middle');

		// データ取得
		var res = null;

		$.ajax({
			url:url,
			type:HTTP_REQUEST_METHOD,
			data:param,
			async:true,
			complete:function(jqXHR, textStatus){
				var json = $.parseJSON(jqXHR.getResponseHeader('X-JSON'));
				// APIエラー
				if (json.APIERR) {
					location.href = ERROR_API_URL;
				}

				// データ取得
				res = jqXHR.responseText;
				var oldEl = $('#dialog');
				var newEl = oldEl.clone(false);
				newEl.get(0).innerHTML = res;
				oldEl.replaceWith(newEl);

				// 位置調整
				Dialog.setDialogPosition(true, true);

				// ダイアログ毎の処理
			    switch (List.search) {
					case 'shiku':
						Dialog.loadDialogList();
						Dialog.getTotalCount();
						break;
					case 'choson':
						break;
					case 'ensen':
						Dialog.loadDialogList();
						break;
					case 'eki':
						Dialog.loadDialogList();
						Dialog.getCount();
						break;
					case 'time':
						Dialog.loadDialogTime();
						break;
					case 'rinsetsu':
						Dialog.showTotalImg();
						break;
					case 'mapshiku':
						break;
					case 'rosen':
						Dialog.showTotalImg();
						Dialog.loadDialogRosen();
						break;
					case 'resortarea':
						break;
					case 'resort':
						Dialog.showTotalImg();
						break;
					case 'joken':
						Dialog.loadDialogList();
						Dialog.showTotalImg();
						break;
					case 'kodawari':
						Dialog.loadDialogList();
						Dialog.showTotalImg();
						break;
			    }

			    // ダイアログ表示
			    $('#dialog').css('display', 'block');

			    // オーバーレイリサイズ
			    Common.resizeOverlay();

			    // ローディング画像非表示
				Common.hideLoading('middle');
			}

		});
	},

	/*
	 * ダイアログ位置調整
	 */
	setDialogPosition: function(tate, yoko) {
		if (tate) {
			// 縦：画面サイズより小さいときは中央、大きいときは画面上部より少し下から表示
		    var y = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
		    var dialog_y = $('#dialog').height();
			if (List.search == 'mapshiku') {
				if (dialog_y < 700)	dialog_y = dialog_y + 700;
			}
		    if (y > dialog_y) {
		    	var center = Common.getCenter();
		    	$('#dialog').css('top', center['y'] - (dialog_y / 2));
		    } else {
		    	var sy = (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
		    	$('#dialog').css('top', sy + 40);
			}
		}
		if (yoko) {
		    // 横：画面サイズより小さいときは中央、大きいときは画面左端より少し右から表示
		    var x = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
		    var dialog_x = $('#dialog').width();
		    if (x > dialog_x) {
		    	var center = Common.getCenter();
		    	$('#dialog').css('left', center['x'] - (dialog_x / 2));
		    } else {
		    	var sx = (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft);
		    	$('#dialog').css('left', sx + 40);
			}
		}
	},

	/*
	 * ダイアログ閉じる
	 */
	hideDialog: function() {
		var $J_dialog = $('#dialog');
		$J_dialog.get(0).innerHTML = '';
		$J_dialog.css('display', 'none');
	},

	/*
	 * 上物全て閉じる
	 */
	hideAll: function() {
		// 選択状態を戻す
		var $J_search_list = $('#search_list');
		$.each(Common.hidden,function(idx,val){
			$J_search_list.children('#' + Common.escapeBracket(idx)).val(val);
		});

		var down = $J_search_list.children('#DOWN').val();
		if ($('#select_ken_name_' + Common.escapeBracket(down)).get(0)) {
			$('#select_ken_name_' + Common.escapeBracket(down)).get(0).innerHTML = Common.hidden.KEN_NAME;
		}

		List.search = null;
		List.searchSub = null;

		// 上物閉じる
		Dialog.hideDialog();
		Common.hideOverlay();
		Common.hideLoading('middle');
		Common.hideLoading('large');

		// 一覧取得が途中で終了していた場合再実行
		if (List.execGetList || List.execGetContents) {
			if ($J_search_list.children('#DOWN').val() == '4') {
				OurMap.getMapInfo();
			} else {
				List.getList();
			}
		}
	},

	/*
	 * ダイアログ内トグル設定
	 */
	setDialogToggle: function(img, idx) {
		var item = 'accoAreaCont_' + Common.escapeBracket(idx);

		if ($('#' + item).is(':visible')) {
			$('#' + item).hide();
			img.src = img.src.replace(/_close/i, '_open');
			img.alt = '開く';
		} else {
			$('#' + item).show();
			img.src = img.src.replace(/_open/i, '_close');
			img.alt = '閉じる';
		}
	},

	/*
	 * ダイアログにデータ設定
	 */
	loadDialogList: function() {
		this.select_count = 0;
		var checks = $('#' + Common.escapeBracket(List.search) + '_list').find('input:checkbox');
		var upperkind = List.search.toUpperCase();
		var $J_search_list = $('#search_list');

		if (List.search == 'joken' || List.search == 'kodawari') {
			// 検索条件反映
			var src = $J_search_list.find('input, select, textarea');
			var dst = $('#' + Common.escapeBracket(List.search) + '_list').find('input, select, textarea');
			Common.setJokenForm(src, dst);
		} else {
			// 選択復元
			if ($J_search_list.children('#' + Common.escapeBracket(upperkind)).get(0)) {
				if (List.search == 'shiku') {
					var p_list = $J_search_list.children('#LOCATE').val().split(',');
				} else if (List.search == 'eki') {
					var p_list = $J_search_list.children('#ENSEN_GROUP').val().split(',');
				}
				var list = $J_search_list.children('#' + Common.escapeBracket(upperkind)).val().split(',');
				var dialog = List.search;

				$.each(checks,function(idx,val){
					if ($.inArray(val.value, list) > -1){
						val.checked = true;
						Dialog.select_count++;
					}
					if (dialog == 'shiku' || dialog == 'eki') {
						// 市区のロケートや駅グループ（沿線）も復元
						if ($.inArray(val.value, p_list) > -1){
							val.checked = true;
						}
					}
				});
			}
			// ボタン切替
			this.checkCount();

			// 町村変更から市区郡変更に来た場合、1件選択した場合のみ町村変更ボタンを表示
			if (List.search == 'shiku') {
				this.showChosonBtn();
			}
		}
	},

	/*
	 * 所要時間ダイアログ表示後処理
	 */
	loadDialogTime: function() {
		// 選択駅復元
		var $J_search_list = $('#search_list');
		var station = $J_search_list.children('#stationname').val().split(',');

		if (typeof(station[0]) != 'undefined') {
			$('#inputStation').val(station[0]);
			this.getCursor()
		}
		if (typeof(station[1]) != 'undefined') {
			$('#inputStation2').val(station[1]);
			this.getCursor()
		}

		// 選択時間復元
		var time = $J_search_list.children('#time').val().split(',');

		if (time[0] != '') {
			$('#searchtime').val(time[0]);
		}
		if (typeof(time[1]) != 'undefined' && time[1] != '') {
			$('#searchtime2').val(time[1]);
		}

		// 選択乗り換え数復元
		var transfer = $J_search_list.children('#transfer').val().split(',');
		if (transfer[0] != '') {
			$('#searchtransfer').val(transfer[0]);
		}
		if (typeof(transfer[1]) != 'undefined' && transfer[1] != '') {
			$('#searchtransfer2').val(transfer[1]);
		}

		// 隣接駅、起点駅チェック復元
		var option = $J_search_list.children('#option').val().split(',');
		if (option[0] != '') {
			var kiten = option[0].substr(0,1);
			if (kiten == 1) $('#option2').attr('checked', true);
			var rinsetsu = option[0].substr(1,1);
			if (rinsetsu == 1) $('#option1').attr('checked', true);
		}

		//予測変換に使用
		loadSuggest();
		loadSuggest2();
	},

	/*
	 * 路線図ダイアログ表示後処理
	 */
	loadDialogRosen: function() {
		//県コードから中心駅の座標を取得

		var $J_search_list = $('#search_list');
		if ($J_search_list.children('#KEN').val() != '') {
			var ken = $J_search_list.children('#KEN').val();
		} else {
			var ken = $J_search_list.children('#HIDDEN_KEN').val();
		}
		var ekiCd = { "01":20220, "02":20619, "03":20940, "04":21044, "05":21137, "06":21392, "07":21551, "08":21710, "09":21736,
					  10:21946, 11:21982, 12:22361, 13:22741, 14:23368, 15:24033, 16:24721, 17:23680, 18:23855, 19:23408,
					  20:24282, 21:24429, 22:23545, 23:25077, 24:25392, 25:25498, 26:25647, 27:25853, 28:26357, 29:26669,
					  30:26839, 31:26880, 32:27021, 33:27051, 34:27365, 35:27583, 36:27648, 37:27724, 38:27891, 39:27968,
					  40:28356, 41:28389, 42:28533, 43:28626, 44:28742, 45:28903, 46:28933, 47:29031 };

		//物件一覧の検索条件窓のチェックをすべて外す


		//予測変換に使用
		loadSuggest();

		//路線図を出力
		loadekispart(ekiCd[ken], ken);
	},

	/*
	 * 町村選択ボタン表示制御
	 */
	showChosonBtn: function() {
		if (this.choson) {
			var choson_btn = $('img.choson_btn');
			if (this.select_count == 1) {
				$.each(choson_btn,function(idx,val){
					$(val).css('display','block');
				});
			} else if (this.select_count < 1 || this.select_count > 1) {
				$.each(choson_btn,function(idx,val){
					$(val).css('display','none');
				});
			}
		}
	},

	/*
	 * チェックボックス１件チェック
	 */
	checkDialogList: function(chk) {
		// チェック数カウント
		var pid = chk.parentNode.parentNode.id; // ロケートコード

		if (chk.checked) {
			this.select_count++;
			if (chk.name == 'ENSEN') {
				// 沿線は6以上選択するとエラー
				if (this.select_count > 5) {
					$.each($('div.ensen_max_error'),function(idx,val){
						$(val).css('display','block');
						val.innerHTML = ERROR_MSG_ENSEN_SELECT_OVER;
					});
				}
			} else {
				// ロケート内の全ての市区がチェックされるとロケートもチェックする
				var inputs = $('.locator ul#' + Common.escapeBracket(pid) + ' li input');
				var checks = $(inputs).filter(function (index) {
					return $(this).is(':checked');
			    })
				var inputs_len = inputs.length;
				var checks_len = checks.length;
				if (inputs_len == checks_len) {
					$('#GROUP_' + Common.escapeBracket(pid)).attr('checked', true )
				}
			}
		} else {
			this.select_count--;
			if (chk.name == 'ENSEN') {
				// 沿線は5以下になればエラー消す
				if (this.select_count < 6) {
					$.each($('div.ensen_max_error'),function(idx,val){
						$(val).css('display','none');
						$(val).empty();
					});
				}
			} else {
				// ロケートのチェック外す
				$('#GROUP_' + Common.escapeBracket(pid)).attr('checked', false);
			}
		}

		// 件数取得
		if (List.search != null) {
			if (List.search == 'shiku') {
				this.getTotalCount();
			} else if (List.search == 'eki') {
				if (this.select_count > 0) {
					this.getCount();
				} else {
					this.showTotalImg(0);
				}
			}
		}

		// ボタン切替
		this.checkCount();

		// 町村変更から市区郡変更に来た場合、1件選択した場合のみ町村変更ボタンを表示
		if (List.search == 'shiku') {
			this.showChosonBtn();
		}
	},

	/*
	 * チェックボックスすべてチェック
	 */
	checkAll: function(id) {
		var checks = $('.locator ul#' + Common.escapeBracket(id) + ' li input');
		var checked = $('#GROUP_' + Common.escapeBracket(id)).is(':checked');

		$.each(checks,function(idx,val){
			if (checked) {
				if (val.checked == false) {
					Dialog.select_count++;
				}
			} else {
				Dialog.select_count--;
			}
			val.checked = checked;
		});

		// 件数取得
		if (List.search != null) {
			if (List.search == 'shiku') {
				this.getTotalCount();
			} else if (List.search == 'eki') {
				if (this.select_count > 0) {
					this.getCount();
				} else {
					this.showTotalImg(0);
				}
			}
		}

		// ボタン切替
		this.checkCount();

		// 町村変更から市区郡変更に来た場合、1件選択した場合のみ町村変更ボタンを表示
		if (List.search == 'shiku') {
			this.showChosonBtn();
		}
	},

	/*
	 * 市区と駅の合計数取得
	 */
	getTotalCount: function() {
		// リアルタイム集計しないフラグ(USE_TOTAL_FLG)が立ってるときは実行しない
		if (!$('#DIALOG_TOTAL').get(0)) {
			return;
		}

		var all = $('#DIALOG_TOTAL').val(); // 初回のチェックなし合計数
		var total = 0;
		var eki_list = new Array();
		var checks = $("#" + Common.escapeBracket(List.search) + '_list').find('input:checkbox');
		var checked = 0;

		$.each(checks,function(idx,val){
			if (val.name != 'GROUP' && $(val).is(':checked')) {
				if (List.search == 'eki') { // 駅
					var eki = val.value.split('_');
					if (eki_list.indexOf(eki[1]) == -1) { // 異なる沿線の同一駅はカウントしない
						eki_list.push(eki[1]);
						var name = val.parentNode.getElementsByTagName('label')[0].innerHTML;
						var count = name.substring(name.indexOf('(', 0)+1, name.indexOf(')', 0));
						count = count.replace(',', '');
						total = parseInt(total,10) + parseInt(count,10);
					}
				} else { // 市区
					var name = val.parentNode.getElementsByTagName('label')[0].innerHTML;
					var count = name.substring(name.indexOf('(', 0)+1, name.indexOf(')', 0));
					count = count.replace(',', '');
					total = parseInt(total,10) + parseInt(count,10);
				}
				checked++;
			}
		});

		// 合計数画像表示
		this.showTotalImg(total);
	},

	/*
	 * 合計数画像表示
	 */
	showTotalImg: function(total) {
		// リアルタイム集計しないフラグ(USE_TOTAL_FLG)が立ってるときは実行しない
		if (!$('#DIALOG_TOTAL').get(0)) {
			return;
		}

		$.each($('li.count_img'),function(idx,val){
			$(val).remove();
		});

		if (typeof(total) == 'undefined') {
			total = $('#DIALOG_TOTAL').val();
		}
		total = String(total);
		total = total.replace(',', '');
		var max = TOTAL_MAX;
		var tag = '';
		var ar = total.split('');
		var none = parseInt(max,10) - ar.length;
		for (var i=0; i<none; i++) {
			tag += '<li class="count_img"><img src="/images/common/ico/ico_num011.gif" alt="" width="17" height="22" /></li>';
		}

		$.each(ar,function(idx,val){
	        tag += '<li class="count_img"><img src="/images/common/ico/ico_num0' + val + '.gif" alt="" width="17" height="22" /></li>';
		});

		$.each($('div ul.count'),function(idx,val){
			$(val).prepend(tag);
		});
	},

	/*
	 * 件数取得用タイマー
	 */
	preGetCount: function() {
		// IE6セレクトボックスのマウスホイール抑止
		if (List.userAgent == 'ie6') {
			window.focus();
		}

		// 選択された検索条件が前回と一致していないときのみ、タイマーにセット
		clearTimeout(List.objTimer);
		var p = Dialog.getSearchCond();
		if (List.apiparam != p) {
			List.objTimer = setTimeout("Dialog.getCount()", TIME_WAIT);
		}
	},

	/*
	 * ダイアログ内のチェック値取得
	 */
	getSearchCond: function() {
		var value_list = new Array();
		var elem = $('#' + Common.escapeBracket(List.search) + '_list').find('input , select, textarea');

		$.each(elem,function(idx,val){
			if (val.type != 'hidden' && val.name != 'GROUP') {
				if (val.type == 'select-one' || $(val).is(':checked')) {
					value_list.push(val.value);
				}
			}
		});
		var value = value_list.join('');
		return value;
	},

	/*
	 * 件数取得
	 */
	getCount: function() {
		// リアルタイム集計しないフラグ(USE_TOTAL_FLG)が立ってるときは実行しない
		if (!$('#DIALOG_TOTAL').get(0)) {
			return;
		}

		if (!$("#" + Common.escapeBracket(List.search) + '_list').get(0)) {
			return;
		}

		var inputs = $('#' + Common.escapeBracket(List.search) + '_list').find('input:checkbox');
		var checks = $(inputs).filter(function (index) {
			return $(this).is(':checked');
	    })

		if (checks.length < 1 && List.search != 'rinsetsu' && List.search != 'joken' && List.search != 'kodawari') {
			this.showTotalImg(0);
			return;
		}

		// 選択された検索条件を更新
		List.apiparam = this.getSearchCond();

		// APIリクエストが動いていればアボート
		if (List.objApi != null) {
			List.objApi.abort();
			List.objApi = null;
		}

		var count = 0;
		List.searchSub = 'count';
		var param = Common.getParam();

		$.ajax({
			url:DIALOG_COUNT_URL,
			type:HTTP_REQUEST_METHOD,
			data:param,
			async:true,
			beforeSend:function(jqXHR,settings){
				List.objApi = jqXHR;
			},
			complete:function(jqXHR, textStatus){

				if(textStatus == "abort"){
					return false;
				}

				var json = $.parseJSON(jqXHR.getResponseHeader('X-JSON'));
				// APIエラー
				if (json.APIERR) {
					location.href = ERROR_API_URL;
				}

				// 件数表示
	        	count = json.COUNT;

	        	// トータル件数更新
	    		Dialog.showTotalImg(count.TOTAL);

	    		// 検索条件、こだわり条件ダイアログの場合は、それぞれの件数も更新
	        	if (List.search == 'joken' || List.search == 'kodawari') {
	        		var list = count;
	        		$.each(list,function(idx,val){

	        			var cnt = val.replace(',', '');
	        			var _idx = Common.escapeBracket(idx);
	        			if (parseInt(cnt,10) < 1) {
	        				$('#' + _idx + '_r').addClass('off');
    		    		} else {
    		    			$('#' + _idx + '_r').removeClass('off');
    		    		}

    		    		if($('#CNT_' + _idx + '_r').get(0) != null){
    		    			$('#CNT_' + _idx + '_r').get(0).innerHTML = '(' + val + ')';
    		    		}
	        		});
	        	}

	        	Common.hideLoading('middle');
	    	    List.objApi = null;

	    		// ボタン切替
	    		Dialog.checkCount();

			}
		});
	},

	/*
	 * チェックボックスのチェック数チェック（ボタン切替とエラー表示）
	 */
	checkCount: function() {
		var enable = false;
		if (List.search == 'ensen') {
			if (this.select_count > 0 && this.select_count < 6) {
				enable = true;
			}
		} else {
			if (this.select_count > 0) {
				enable = true;
			}
		}
		var btn_on = $('img.btn_on');
		var btn_off = $('img.btn_off');

		if (enable) {
			$.each(btn_on,function(idx,val){
				$(val).css({'cursor':'pointer',
							'display':'inline'});
			});
			$.each(btn_off,function(idx,val){
	    		$(val).css('display', 'none');
			});
		} else {
			$.each(btn_off,function(idx,val){
				$(val).css({'cursor':'default',
							'display':'inline'});
			});
			$.each(btn_on,function(idx,val){
	    		$(val).css('display', 'none');
			});
		}
	},

	/*
	 * 戻るボタン
	 */
	backDialog: function(down) {
		var $J_search_list = $('#search_list');
		if (this.from_selectdown) {
			// 検索方法選択へ
			this.from_selectdown = false;
			this.selectDown();
		} else if ($J_search_list.children('#SITECD').val() =='00604') {
			// 投資サイトは都道府県選択へ
			this.selectKen();
			$J_search_list.children('#DOWN').val('');
		} else {
			var url = '';
			if (Common.is47Site()) {
				// 47サイトトップへ
				url = 'http://' + location.hostname;
			} else {
				// FLASHへ
				if ($J_search_list.children('#ITEM').val() == 'kr' || $J_search_list.children('#ITEM').val() == 'jr') {
					url += '/rent/';
				} else if ($J_search_list.children('#ITEM').val() == 'ks' || $J_search_list.children('#ITEM').val() == 'js') {
					url += '/sell/';
				}
				url += $J_search_list.children('#ART').val() + '_' +  $J_search_list.children('#KEN').val();
			}
			location.href = url;
		}
	},

	/*
	 * 選択した検索方法を設定
	 */
	setDown: function(down) {
		$('#search_list').children('#DOWN').val(down);
		this.from_selectdown = true;

		// 次画面表示
		this.selectDialog(down, false);
	},

	/*
	 * 選択した都道府県を設定
	 */
	setKen: function(kencd, kenname, areacd) {
		var $J_search_list = $('#search_list');
		$J_search_list.children('#AREA').val(areacd);
		$J_search_list.children('#KEN').val(kencd);

		var down = $J_search_list.children('#DOWN').val();
		if ($('#select_ken_name_' + Common.escapeBracket(down)).get(0)) {
			$('#select_ken_name_' + Common.escapeBracket(down)).get(0).innerHTML = kenname;
		}

		// 次画面表示
		this.selectDialog();
	},

	/*
	 * 選択した地域を設定（リゾート）
	 */
	setResortArea: function(areacd, areaname, resortcd) {
		$('#search_list').children("#AREA").val(areacd);
		$('#search_list').children("#RESORT").val(resortcd);
		if ($('#select_ken_name_1').get(0)) {
			$('#select_ken_name_1').get(0).innerHTML = areaname;
		}

		// 次画面表示
		this.selectResortShumoku();
	},

	/*
	 * 物件検索実行（市区）
	 */
	doSearchShiku: function(btn) {
		var $J_search_list = $('#search_list');

		// チェックした値を取得
		var locate_list = new Array();
		var shiku_list = new Array();

		var inputs = $('#shiku_list').find('input:checkbox');
		var checks = $(inputs).filter(function (index) {
			return $(this).is(':checked');
		});
		$.each(checks,function(idx,val){
			if (val.name == 'GROUP'){
				locate_list.push(val.value);
			} else {
				shiku_list.push(val.value);
			}
		});

		// ダイアログ閉じる
		this.hideDialog();

		// 町村選択非活性
		if ((shiku_list.length == 1 && $J_search_list.children('#SHIKU').val() != shiku_list[0]) || shiku_list.length > 1) {
			$J_search_list.children('#CHOSON').val('');
			if ($('#disp_choson').get(0)) $('#disp_choson').css('display', 'none');
			$('#disp_shiku').addClass('last');
		}

		// 値をformにセット
		$J_search_list.children('#LOCATE').val(locate_list.join(','));
		$J_search_list.children('#SHIKU').val(shiku_list.join(','));

		if (btn == 'joken') {
			this.selectJoken();
		} else if (btn == 'choson') {
			this.selectChoson();
		} else {
			// 物件一覧取得
			List.getList();
		}
	},

	/*
	 * 選択した町村を設定
	 */
	doSearchChoson: function(choson) {
		var $J_search_list_CHOSON = $('#search_list').children('#CHOSON');
		$J_search_list_CHOSON.val(choson);
		this.hideDialog();
		$('#disp_choson').css('display', 'block');
		$('#disp_shiku').removeClass('last');
		List.getList();
	},

	/*
	 * 物件検索実行（所要時間）
	 */
	 doSearchTime: function(btn) {
		var errCheck = function (){
        	// 路線図を表示する(中心路線図CD, 識別子を指定)
        	Dialog.searchTimeErrCheck(btn);
        }
		// 所要時間検索エラーチェックを呼び出す
		expmapLoad(errCheck);
	},

	/*
	 * 所要時間検索エラーチェック
	 */
	searchTimeErrCheck: function(btn) {
		// 物件一覧取得
		//入力内容が空白の場合
		var arystname = new Array();
		var arytime = new Array();
		var arytransfer = new Array();
		var e = "";

		for ( var f=0; f<2; f++ ) {
			arystname[f] = $('#inputStation'+e).val();
			arytime[f] = $('#searchtime'+e).val();
			arytransfer[f] = $('#searchtransfer'+e).val();
			e = 2;
		}

		if (arystname[0] == "" && arystname[1] == "") {
			$('#error').css('display', 'inline')
			$('#error').get(0).innerHTML = "駅名が入力されていません。";
			return false;
		}

		// 駅すぱあとアプリケーションオブジェクト
		var expApp = new CExpApp();

		var g = 0;
		var flg = 0;
		var errStation = "";
		var dupStation = "";
		var elId = "";
		for ( var h=0; h<arystname.length; h++ ) {
			var stnameSJIS = EscapeSJIS(arystname[h]);

			//駅名から一覧検索
			expApp.getStationList(stnameSJIS,
				function(stationList, errorCode){
					if(errorCode == CExpApp.SUCCESS) {
						var j=0;
						var stationType = "";

						for (var i = 0; i<stationList.length; i++) {
							if(stationList[i].getName() == arystname[g]){
								//駅リストの中に一致する駅が存在する
								j = j + 1
								// 駅区分を取得
								stationType = stationList[i].getType();
								break;
							}
						}
						if(j == 0){
							//一致する駅が存在しない時はエラーを返す
							//取得内容が1件以外はエラー
							if (stationList.length == 0 || stationList.length == undefined || stationList.length == null || stationList.length == 1) {
								flg = 1;
								errStation += "「"+arystname[g]+"」";
							}else if (stationList.length > 1){
								var k = 0;
								for(l=0;l<stationList.length;l++){
									//かなかどうかチェック
									var station = stationList[l].getName();
									var n = station.indexOf(arystname[g]);
									if(n != -1){
										k = k + 1;
									}
								}
								if(k != 0){
									flg = 2;
									dupStation += "「"+arystname[g]+"」";
									if ( g == 0 ) {
										elId = "inputStation";
									} else if ( g == 1 ) {
										elId = "inputStation2";
									}
								}else{
									flg = 1;
									errStation += "「"+arystname[g]+"」";
								}
							}
						} else {
							// 駅区分が「駅」
							if(stationType != 1){
								flg = 1;
								errStation += "「"+arystname[g]+"」";
							}
						}
					}else if(errorCode == 10) {
						if ( arystname[g] != "" ) {
							flg = 1;
							errStation += "「"+arystname[g]+"」";
						}
					}
					g++;
					//フラグによって処理変更
					if ( g == 2 ) {
						if ( flg == 0 ) {
							var VEKI_NM = arystname.join(',');
							var VEKI_TIME = arytime.join(',');
							var VEKI_TRANS = arytransfer.join(',')
							if ( $('#option2').is(':checked') == true ) {
								var VEKI_OPT = $('#option2').val();
							} else {
								var VEKI_OPT = 0;
							}
							if ( $('#option1').is(':checked') == true ) {
								VEKI_OPT = VEKI_OPT+$('#option1').val();
							} else {
								VEKI_OPT = VEKI_OPT+"0";
							}
							VEKI_OPT = VEKI_OPT+","+VEKI_OPT;

							// 値をformにセット
							var $J_search_list = $('#search_list');
							$J_search_list.children('#stationname').val(VEKI_NM);
							$J_search_list.children('#time').val(VEKI_TIME);
							$J_search_list.children('#transfer').val(VEKI_TRANS);
							$J_search_list.children('#option').val(VEKI_OPT);

							if (btn == 'joken') {
								Dialog.selectJoken('time');
							} else {
								// ダイアログ閉じる
								Dialog.hideDialog();
								List.getList();
							}
						} else if ( flg == 1 ) {
							$('#error').css('display','inline')
							$('#error').get(0).innerHTML = errStation+"に該当する駅が見つかりませんでした。駅名は漢字・ひらがなを正しく入力してください。";
							return;
						} else if ( flg == 2 ) {
							$('#error').css('display','inline')
							$('#error').get(0).innerHTML = dupStation+"を含む駅が複数あります。駅名を選択してください。";
							$("#" + Common.escapeBracket(elId)).focus();
							suggest.research(elId);
							return;
						}
					}
				}
			);
		}
	},

	/*
	 * 物件検索実行（沿線）
	 */
	doSearchEnsen: function() {

		// チェックした値を取得
		var ensen_list = new Array();

		var inputs = $('#ensen_list').find('input:checkbox');
		var checks = $(inputs).filter(function (index) {
			return $(this).is(':checked');
	    });
		$('#select_ensen_list').get(0).innerHTML = '';

		$.each(checks,function(idx,val){
			ensen_list.push(val.value);
			var name = val.parentNode.getElementsByTagName('a')[0].innerHTML;
			name = name.substring(0, name.indexOf('(', 0));
			$('#select_ensen_list').append('<ul id="ensen_' + val.value + '"><li>' + name + '</li></ul>');
		});

		// ダイアログ閉じる
		this.hideDialog();

		// 値をformにセット
		$('#search_list').children('#ENSEN').val(ensen_list.join(','));

		// 駅ダイアログ表示
		this.selectDialog('2',true);
	},

	/*
	 * 物件検索実行（駅）
	 */
	doSearchEki: function(btn) {

		// チェックした値を取得
		var eki_list = new Array();
		var ensen_list = new Array();
		var group_list = new Array();

		var inputs = $('#eki_list').find('input:checkbox');
		var checks = inputs.filter(function (index) {
			return $(this).is(':checked');
	    })

	    $.each(checks,function(idx,val){
			if (val.name == 'GROUP') {
				group_list.push(val.value);
			} else {
				eki_list.push(val.value);

				// 沿線選択時に沿線を選択したが、駅選択では選ばれなかった沿線は除外
				var eki = val.value.split('_');
				var tmp = $(ensen_list).filter(function (idx,val) {
					if (val == eki[0]) {
						return true;
					} else {
						return false;
					}
			    });

				if(!tmp.get(0)) {
					ensen_list.push(eki[0]);
				}
			}
		});

		// ダイアログ閉じる
		this.hideDialog();

		// 値をformにセット
		var $J_search_list = $('#search_list');
		$J_search_list.children('#ENSEN_GROUP').val(group_list.join(','));
		$J_search_list.children('#ENSEN').val(ensen_list.join(','));
		$J_search_list.children('#EKI').val(eki_list.join(','));

		if (btn == 'joken') {
			this.selectJoken();
		} else {
			// 物件一覧取得
			List.getList();
		}
	},

	/*
	 * 物件検索実行（路線図から探す）
	 */
	doSearchRosen: function() {
		var stCodeArr = new Array();
		for ( var i=1; i<=10; i++ ) {
			var station_cd = "station_cd"+i;
			var station_name = "station_name"+i;

			if ( $('#' + station_cd).val() != "" ) {
				stCodeArr.push($('#' + station_cd).val());
			}
		}

		//駅未選択の場合エラー
		if ( stCodeArr == "" ) {
			alert("駅名が選択されていません。");
			return;
		}

		//オーバーレイでチェックした検索条件を物件一覧に反映させる
		var src = $('#search_list_rosen').find('input , select, textarea');
		var dst = $('#search_list').find('input , select, textarea');
		Common.setJokenForm(src, dst);

		//プルダウンメニューも反映させる
		var option1 = document.search_list.getElementsByTagName("option");	//物件一覧の検索窓のoption 部分
		var option2 = document.search_list_rosen.getElementsByTagName("option");	//オーバーレイの検索窓のoption 部分
		for ( var i=0; i<option2.length; i++ ) {
			if ( option2[i].selected == true ) {
				for ( var j=0; j<option1.length; j++ ) {
					if ( option1[j].value == option2[i].value ) {
						option1[j].selected = option2[i].selected;
					}
				}
			}
		}

		var VEKI = stCodeArr.join(',');

		// 値をformにセット
		$('#search_list').children('#VEKI').val(VEKI);
		// オーバーレイを消す
		this.hideDialog();

		// 物件一覧表示
		List.getList(null, "search_list_rosen");
	},

	/*
	 * 物件検索実行（リゾート）
	 */
	doSearchResort: function(btn) {
		var resort = document.getElementsByTagName("input");
		for ( var i=0; i<resort.length; i++ ) {
			if ( resort[i].name == "RESORTART" && resort[i].checked == true ) {
				$('#ART').val(resort[i].value);
			}
		}

		// ダイアログ閉じる
		this.hideDialog();

		// 物件一覧取得
		List.getList();
	},

	/*
	 * 所要時間検索で、隣接駅をチェックした時のみoptionの値を変更
	 * option  => データを色々変えていく
	 * option2 => 最初のデータを保持（最終的にoptionの値を代入する）
	 */
	rinsetsuCheck: function(cd){
		var option2 = $('#option').val();
		if ( List.search == "rinsetsu" ) {
			option2 = option2.substr(0,2);
		} else {
			option2 = option2.substr(0,1)+1;
		}

		var rinsetsuLen = document.joken_list.elements['rinsetsu[]'].length;
		if ( rinsetsuLen == undefined ) {
			rinsetsuLen = 1;
		}
		var rh =0;
		for ( var i=0; i<rinsetsuLen; i++ ) {
			if ( $('#rinsetsu'+i).is(':checked') == true || $('#rinsetsu'+i).get(0).type == "hidden" ) {
				option2 += $('#rinsetsu'+i).val();
				rh++;
			}
		}
		/*一時分解
			opt1⇒駅含めない(opt2の変更のため)
			opt2⇒隣接駅フラグ
		 * */
		var opt1 = option2.substr(0,1);
		var opt2 = "";
		var otopt = option2.substr(2,option2.length-2);
		if(rh == 1){
			opt2 = '0';
		}else{
			opt2 = '1';
		}
		option2 = opt1 + opt2 + otopt;
		/*二駅対応のため,以降に追加*/
		option2 = option2 + ',' + option2;
		/*～ここまで～*/
		$('#option').val(option2);
		Dialog.preGetCount('joken');
	},

	/*
	 * 所要時間検索で、テキストに入力かれたら検索ボタン反映
	 */
	getCursor: function(){
		if ( $('#inputStation').val() != "" || $('#inputStation2').val() != "" ) {
			$('#btn_on1').css('display', 'inline');
			$('#btn_off1').css('display', 'none');
			if ($('#btn_on2').get(0)) {
				$('#btn_on2').css('display','inline');
				$('#btn_off2').css('display','none');
			}
		} else {
			$('#btn_on1').css('display','none');
			$('#btn_off1').css('display','inline');
			if ($('#btn_on2').get(0)) {
				$('#btn_on2').css('display', 'none');
				$('#btn_off2').css('display', 'inline');
			}
		}
	},


	/*
	 * 物件検索実行（検索条件）
	 */
	doSearchJoken: function() {
		Common.hideLoading('middle');

		// 検索条件反映
		var src = $('#' + Common.escapeBracket(List.search) + '_list').find('input , select, textarea');
		var dst = $('#search_list').find('input , select, textarea');

		Common.setJokenForm(src, dst);
		// 左側検索条件取得
		List.getJoken();

		// ダイアログ閉じる
		this.hideDialog();
	},

	/*
	 * 物件検索実行（市区、沿線、駅を1件クリックした場合）
	 */
	searchList: function(code) {
		this.hideDialog();
		$J_search_list = $('#search_list');
		if (List.search == 'shiku') {
			$J_search_list.children('#LOCATE').val('');
			$J_search_list.children('#SHIKU').val(code);
			List.getList();
		} else if (List.search == 'ensen') {
			$J_search_list.children('#ENSEN').val(code);
			this.selectDialog('2',true);
		} else if (List.search == 'eki') {
			$J_search_list.children('#ENSEN_GROUP').val('');
			$J_search_list.children('#EKI').val(code);
			List.getList();
		}
	},

	/**
	 * ヴァル研のAPIキーを取得する
	 */
	getValApiKey: function() {
		var hostKeyMap = {
			// オンプレ環境・本番
			'toushi-athome.jp'               : '07b3fe7b43334bf0b08e47f9eef6c7c885dab8a0',
			'toushi-athome-stg401.jp'        : '75a944b33629ab3b727f0a9e861710855b42a8b9',
			'toushi-athome-stg402.jp'        : '60f5f32400e5562b46b9747f4a23069332c5fba0',
			'toushi-athome-rel401.jp'        : '36999b227bbfe0ad55b4866fdd62f7b1b1e012c6',
			'toushi-athome-rel402.jp'        : 'd3a5e6eef67fe48c15c95385a441e7feb10819b7',
			'toushi-athome-liv401.jp'        : '0779832a6278833bc7e8a0b2f9f23d61e1a6a4bc',
			'toushi-athome-chk401.jp'        : 'ef3000854fac14b46348aa2cedd6658a7f0d9712',
			'toushi-athome-chk402.jp'        : '3ccf18f0f1aa474bf63b990be781ff02f0e28c92',
			'toushi-athome-chk403.jp'        : '393616e109b472f075b014bb8db9d1966e406486',
			'toushi-athome-chk404.jp'        : '26b182456729920edf4c5b8554a3467e86c28471',
			'toushi-athome-chk405.jp'        : '1a2a5f7638ac347cc8fa37c951b9c694baafd1d3',
			'toushi-athome-chk406.jp'        : '9ae51257937fc6fea8b32ee581471e024b62fa0e',
			'toushi.dev01.athome-develop.com': '8c746211b673eeb07843e2e8a1beccc00326a06a',
			'toushi.dev02.athome-develop.com': '19368b714dd0232283b697685d105358d85e2d98',
			'toushi.dev03.athome-develop.com': '66c63725bd33930fee19e511dfb5e45375509201',
			'toushi.dev04.athome-develop.com': '8caae2ca595e3ce2d187c7027bb17d4722a4fb8e',
			'toushi.dev05.athome-develop.com': '9755504c702c4b58d86e19bd586d4bbd79125587',
			'toushi.dev06.athome-develop.com': '08fd370408cd539fc0353cebcc6b84fe60e9e453',
			'toushilocal'                    : '512a67fe2c74c63a802c97ae2e633f0435a10508',
			// AWS環境
			'toushi-athome-ap01.com': 'b09235833635187a2f575bc66adffe6b512b75ba',
			'toushi-athome-ap02.com': '2204504b230ab5301917377c44e7044cf329d2df',
			'toushi-athome-as01.com': '55187fa535337e7b2ec3a6c1cfd7cb1a740ca96e',
			'toushi-athome-as02.com': '79600cd893fd1b41cdbd41b85f0f72b20c5a4292',
			'toushi-athome-ad01.com': 'cd6193959b07af3364850bde99b602dfaa020caf',
			'toushi-athome-ac01.com': 'e02ccc3bf0b08f7ea778685afc2d327121e04a8e',
			'toushi-athome-ak01.com': '5d9aa3276ceceb5fca2940bc1f1bd6b97cbab014',
			'toushi-athome-ak02.com': 'f845b02a15169859c6806a795fff61695d3fb4a5',
			'toushi-athome-ak03.com': '556e31aa3d6b47d2d9cb04a46d9c4c8b9a7967b4',
			'toushi-athome-ak04.com': '64c53e78cf881b8f7f2d1bbda9185175a4071b2d',
			'toushi-athome-ak05.com': '432f89e03726c2b15e1c9bb40266b6e97f9169d6',
			'toushi-athome-ak06.com': 'c2feda6ab8243dcaaa0825d0bc3169c251f7477d',
			'toushi-athome-ak51.com': '862fd15751194b485cf471bfe22c17d758e62ef9',
			'toushi-athome-ak52.com': 'f4822986e33aab1f63399c180a2a228cc435701d',
			'toushi-athome-ak53.com': 'c228179468c76285b23447a3e0b06c26d7bd530c',
			'toushi-athome-ak54.com': 'bbffc0f22fbff5f5faeefd6f3f5843c1ee3dde13',
			'toushi-athome-ak55.com': '13afef329f4723b87b554b90386722ee02ce3d20',
			'toushi-athome-ak56.com': '66ca0617e445f65b668151ca2c2e04e63c405d45'
		};
		return hostKeyMap[location.hostname];
	}
};

