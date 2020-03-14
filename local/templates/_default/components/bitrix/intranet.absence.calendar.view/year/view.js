function JCCalendarViewYear(date)
{
	this.ID = 'year';
	this._parent = null;

	this.SETTINGS = {};
	this.ENTRIES = [];

	if (!window._YEAR_STYLE_LOADED)
	{
		BX.loadCSS('/bitrix/templates/.default/components/bitrix/intranet.absence.calendar.view/year/view.css');
		window._YEAR_STYLE_LOADED = true;
	}

	BX.bind(window, 'resize', BX.proxy(this.__onresize, this));
}

JCCalendarViewYear.prototype.__onresize = function ()
{
	this.UnloadData(true);
	this.__drawData();
}

JCCalendarViewYear.prototype.Load = function()
{
	this._parent.FILTER.SHORT_EVENTS = 'Y';

	if (null != this.ENTRIES && this.ENTRIES.length > 0) this.UnloadData();

	this.__drawLayout();

	this.TYPE_BGCOLORS = this._parent.TYPE_BGCOLORS;
	this.ADJECT_COLORS = this._parent.ADJECT_COLORS;

	this._parent.LoadData(
		this.SETTINGS.DATE_START,
		this.SETTINGS.DATE_FINISH
	);
}

JCCalendarViewYear.prototype.LoadData = function(DATA)
{
	this.ENTRIES = DATA;

	if (BX.browser.IsIE())
		setTimeout(BX.proxy(this.__drawData, this), 10);
	else
		this.__drawData(true);
}

JCCalendarViewYear.prototype.UnloadData = function(bClearOnlyVisual)
{
	if (null == this.ENTRIES)
		return;

	if (null == bClearOnlyVisual) bClearOnlyVisual = false;

	for (var i = 0; i < this.ENTRIES.length; i++)
	{
		if (null != this.ENTRIES[i].DATA)
		{
			for (var j = 0; j < this.ENTRIES[i].DATA.length; j++)
			{
				if (null == this.ENTRIES[i].DATA[j].VISUAL) continue;

				this._parent.UnRegisterEntry(this.ENTRIES[i].DATA[j]);
				BX.cleanNode(this.ENTRIES[i].DATA[j].VISUAL, true);
				this.ENTRIES[i].DATA[j].VISUAL = null;
				
				var obRow = document.getElementById('year-entry-' + i + '-' + j);
				if (null != obRow && bClearOnlyVisual) {obRow.parentNode.removeChild(obRow); delete obRow;}
			}
		}

		var obCol = document.getElementById('bx_calendar_user_' + this.ENTRIES[i]['ID']);
		if (null != obCol) {
			obCol.parentNode.removeChild(obCol); delete obCol;
		}
	}
	if (!bClearOnlyVisual) this.ENTRIES = null;
}

JCCalendarViewYear.prototype.GetYearFull = function(getyearnext){
	todayY = new Date();
	var ny = todayY.getFullYear();
	
	if (getyearnext)
		ny = getyearnext;

	if ((ny % 100 === 0) && (ny % 400 != 0))
	{
		return 365;
	}
	else if (ny % 4 === 0)  
	{
		return 366;
	}
	else  
	{
		return 365;
	}
}

JCCalendarViewYear.prototype.SetSettings = function (SETTINGS)
{
	this.SETTINGS = SETTINGS;

	var today = new Date();

	if (null == this.SETTINGS.DATE_START || today >= this.SETTINGS.DATE_START && today <= this.SETTINGS.DATE_FINISH)
		this.SETTINGS.DATE_START = today
	var yearss = this.GetYearFull(this.SETTINGS.DATE_START.getFullYear());
	
	var adder = 0;
	if(yearss==365)
		adder = this.SETTINGS.DATE_START.getDay() >= this.SETTINGS.FIRST_DAY ? 0 : -365;
	else
		adder = this.SETTINGS.DATE_START.getDay() >= this.SETTINGS.FIRST_DAY ? 0 : -366;

	/*this.SETTINGS.DATE_START.setDate(
		this.SETTINGS.DATE_START.getDate() - this.SETTINGS.DATE_START.getDay() + this.SETTINGS.FIRST_DAY + adder
	);*/
	this.SETTINGS.DATE_START.setMonth(0,1);

	this.SETTINGS.DATE_START.setHours(0);
	this.SETTINGS.DATE_START.setMinutes(0);
	this.SETTINGS.DATE_START.setSeconds(0);
	this.SETTINGS.DATE_START.setMilliseconds(0);

	this.SETTINGS.DATE_FINISH = new Date(this.SETTINGS.DATE_START.valueOf());
	this.SETTINGS.DATE_FINISH.setDate(this.SETTINGS.DATE_FINISH.getDate()+yearss);
}

JCCalendarViewYear.prototype.Unload = function()
{
	BX.unbind(window, 'resize', BX.proxy(this.__onresize, this));
	this.UnloadData();
}

// Eva: for navigation to the next or previous year in calendar
JCCalendarViewYear.prototype.changeYear = function(dir)
{
	if (dir != -1) dir = 1;
	
	this.SETTINGS.DATE_START.setYear(this.SETTINGS.DATE_START.getFullYear() + dir);
	this.SETTINGS.DATE_FINISH = new Date(this.SETTINGS.DATE_START);
	this.SETTINGS.DATE_FINISH.setMonth(this.SETTINGS.DATE_FINISH.getMonth() + 11);
	this.SETTINGS.DATE_FINISH.setDate(this.SETTINGS.DATE_FINISH.getDate() + 31);

	this.Load();
}

// Eva: for getting day's number in calendar
JCCalendarViewYear.prototype.GetDateNumeric = function(date_start)
{
	var da = new Date(date_start);
	var start = new Date(da.getFullYear(), 0, 0);
	var diff = da - start;
	var oneDay = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff / oneDay);
	return day;
}

// Eva: for getting number of point in array = search in arrays
JCCalendarViewYear.prototype.find = function(array, value)
{
	for (var i = 0; i < array.length; i++) {
		if (array[i] == value) return i;
	}
	return -1;
}

JCCalendarViewYear.prototype.__drawLayout = function()
{
	var _this = this;

	var today = new Date();
	//today.setMonth(0,0);
	
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today.setMilliseconds(0);

	this._parent.CONTROLS.CALENDAR.innerHTML = '';

	this.obTable = document.createElement('TABLE');
	this.obTable.className = 'bx-calendar-week-main-table year-tpl-table';
	this.obTable.setAttribute('cellSpacing', '0');

	this._parent.CONTROLS.CALENDAR.appendChild(this.obTable);

	//this.obTable.appendChild(document.createElement('THEAD'));
	this.obTable.appendChild(document.createElement('TBODY'));

	// generate controls
	var obRow = this.obTable.tBodies[0].insertRow(-1);

	obRow.insertCell(-1);
	obRow.id = 'row-year-empty';
	obRow.cells[0].className = 'bx-calendar-week-empty year-empty';
	obRow.cells[0].innerHTML = '&nbsp;';
	
	// generate rows for days of holiday
	var obDayRow = this.obTable.tBodies[0].insertRow(-1);
	obDayRow.insertCell(-1);
	obDayRow.id = 'row-daysholiday';
	obDayRow.cells[0].className = 'bx-calendar-daysholiday';
	obDayRow.cells[0].innerHTML = jsBXAC.MESSAGES.ADDIT_COUNT_DAYS;
	var obDayRowT = this.obTable.tBodies[0].insertRow(-1);
	obDayRowT.insertCell(-1);
	obDayRowT.id = 'row-daysholiday-already';
	obDayRowT.cells[0].className = 'bx-calendar-daysholiday';
	obDayRowT.cells[0].innerHTML = jsBXAC.MESSAGES.ADDIT_COUNT_REST;
	// ----------

	var date_finish = new Date(this.SETTINGS.DATE_FINISH.valueOf());
	date_finish.setDate(date_finish.getDate()-1);
	var text = this.SETTINGS.DATE_START.getDate();
	if (this.SETTINGS.DATE_START.getMonth() != date_finish.getMonth())
	{
		text += ' ' + this._parent.MONTHS_R[this.SETTINGS.DATE_START.getMonth()];
	}

	if (this.SETTINGS.DATE_START.getFullYear() != date_finish.getFullYear())
	{
		text += ' ' + this.SETTINGS.DATE_START.getFullYear();
	}

	text += ' - ' + date_finish.getDate() + ' ' + this._parent.MONTHS_R[date_finish.getMonth()] + ' ' + date_finish.getFullYear();

	//obRow.cells[0].innerHTML +=
	this._parent.CONTROLS.DATEROW.innerHTML =
	'<table class="bx-calendar-week-control-table" align="center"><tr>'
		+ '<td><a href="javascript:void(0)" class="bx-calendar-week-icon bx-calendar-week-back"></a></td>'
		+ '<td>' + text + '</td>'
		+ '<td><a href="javascript:void(0)" class="bx-calendar-week-icon bx-calendar-week-fwd"></a></td>'
		+ '</tr></table>';

	//var arLinks = obRow.cells[0].getElementsByTagName('A');
	var arLinks = this._parent.CONTROLS.DATEROW.getElementsByTagName('A');
	arLinks[0].onclick = function() {_this.changeYear(-1)}
	arLinks[1].onclick = function() {_this.changeYear(1)}
	
	//HOLIDAYS_NONWORK
	var hol_non = this.SETTINGS.HOLIDAYS_NONWORK;
	var array_holidays = [];
	if (hol_non.length > 0)
	{
		for (var hol = 0; hol < hol_non.length; hol++)
		{
			//var strdate = '7.01';
			var arrdate = hol_non[hol].split('.');
			var dayholiday = new Date(this.SETTINGS.DATE_START.getFullYear(), parseInt(arrdate[1])-1, parseInt(arrdate[0]));
			array_holidays.push(this.GetDateNumeric(dayholiday.valueOf()));	
		}
	}

	var cur_date = new Date(this.SETTINGS.DATE_START.valueOf());
	var bDayViewRegistered = this._parent.isViewRegistered('day');
	var yearss = this.GetYearFull(this.SETTINGS.DATE_START.getFullYear());
	for (var i = 0; i < yearss; i++)
	{
		var obRowY = this.obTable.tBodies[0].insertRow(-1);
		var obCell = obRowY.insertCell(-1);

		obCell.className = 'bx-calendar-week-day';
		obCell.id = 'year_day_' + this.GetDateNumeric(cur_date.valueOf());
		if (cur_date.valueOf() == today.valueOf())
			obCell.className += ' bx-calendar-week-today';
		
		//HOLIDAYS_NONWORK
		if (cur_date.getDay() == yearss-1)
			obCell.className += ' bx-calendar-week-holiday';
		else if(this.SETTINGS.WEEK_HOLIDAYS.length > 0 && this.find(this.SETTINGS.WEEK_HOLIDAYS, cur_date.getDay()) >= 0)
		{
			obCell.className += ' bx-calendar-week-holiday';
		}
		else if (array_holidays.length > 0)
		{
			if (array_holidays.indexOf(this.GetDateNumeric(cur_date.valueOf())) >= 0 )
			{
				obCell.className += ' bx-calendar-week-holiday';
			}
		}

		var day = cur_date.getDate();
		if (day < 10) day = '0' + day;
		if (bDayViewRegistered)
		{
			var obLink = obCell.appendChild(document.createElement('A'));
			obLink.href = "javascript:void(0)";
			obLink.BX_DAY = new Date(cur_date.valueOf());
			obLink.onclick = function()
			{
				_this.SETTINGS.DATE_START = this.BX_DAY;
				_this.SETTINGS.DATE_FINISH = this.BX_DAY;
				_this._parent.SetView('day');
			}
			//var obLink = obCell.appendChild(document.createElement('span'));
			var month_text = (cur_date.getMonth()+1>9 ? cur_date.getMonth()+1 : '0'+(cur_date.getMonth()+1));
			obLink.innerHTML = this._parent.DAYS[cur_date.getDay()] + ', ' + day + '<br>' + month_text;//this._parent.MONTHS[cur_date.getMonth()] + ', ' +
		}
		else
		{
			var month_text = (cur_date.getMonth()+1>9 ? cur_date.getMonth()+1 : '0'+(cur_date.getMonth()+1));
			obCell.innerHTML = this._parent.DAYS[cur_date.getDay()] + ', ' + day + '.' + month_text + '.';
		}

		cur_date.setDate(cur_date.getDate() + 1);
	}
}

JCCalendarViewYear.prototype.__drawData = function(redata)
{
	if(null == redata) redata = false;
	var today = new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today.setMilliseconds(0);

	var date_start = this.SETTINGS.DATE_START;
		date_finish = new Date(date_start);
		
	var yearss = this.GetYearFull(this.SETTINGS.DATE_START.getFullYear());
	date_finish.setDate(date_finish.getDate() + yearss);
	date_finish.setSeconds(date_finish.getSeconds() - 1);
	
	var obRow = BX('row-year-empty');//this.obTable.tBodies[0].insertRow(-1);
	obRow.cells[0].className = 'bx-calendar-week-first-col year-empty';
	
	var obDayRow = BX('row-daysholiday');
	var obDayRowT = BX('row-daysholiday-already');
	console.log(this.ENTRIES);
	for (var i = 0; i < (null == this.ENTRIES ? 0 : this.ENTRIES.length); i++)
	{
		// check user of actual range of absence
		for (var j = 0; j < this.ENTRIES[i]['DATA'].length; j++)
		{
			var ts_start = this.ENTRIES[i]['DATA'][j]['DATE_ACTIVE_FROM'];
			var ts_finish = this.ENTRIES[i]['DATA'][j]['DATE_ACTIVE_TO'];

			if (date_start.valueOf() > ts_finish.valueOf() || date_finish.valueOf() < ts_start.valueOf())
			{
				this.ENTRIES[i]['DATA'].splice(j,1)
			}
		}

		if (this.ENTRIES[i]['DATA'].length == 0 && !this._parent.FILTER.USERS_ALL)
		{
			continue;
		}
		//obRow.onmouseover = jsBXAC._hightlightRow;
		//obRow.onmouseout = jsBXAC._unhightlightRow;
		
		var obColl = obRow.insertCell(-1);
		obColl.id = 'bx_calendar_user_' + this.ENTRIES[i]['ID'];
		obColl.className = 'year_user_rotate';

		var obNameContainer = obColl.appendChild(document.createElement('DIV'));

		var strName = this._parent.FormatName(this.SETTINGS.NAME_TEMPLATE, this.ENTRIES[i]);

		obNameContainer.title = strName;

		if (this.ENTRIES[i]['DETAIL_URL'])
		{
			var obName = document.createElement('A');
			obName.appendChild(document.createTextNode(strName));
			obName.href = this.ENTRIES[i]['DETAIL_URL'];
		}
		else
		{
			var obName = document.createTextNode(strName);
		}

		obNameContainer.appendChild(obName);
		
		var obRowsAvail = this.obTable.tBodies[0].rows[3].cells.length,
			obRowsBAvail = this.obTable.tBodies[0].rows[0].cells.length;
		//console.log(obRowsAvail+' '+obRowsBAvail);
		if(obRowsAvail > obRowsBAvail)
			redata = false;

		var cur_date = new Date(this.SETTINGS.DATE_START.valueOf());
		if(redata)
		{
			var hol_non = this.SETTINGS.HOLIDAYS_NONWORK;
			var array_holidays = [];
			for (var hol = 0; hol < hol_non.length; hol++)
			{
				var arrdate = hol_non[hol].split('.');
				var dayholiday = new Date(this.SETTINGS.DATE_START.getFullYear(), parseInt(arrdate[1])-1, parseInt(arrdate[0]));
				array_holidays.push(this.GetDateNumeric(dayholiday.valueOf()));	
			}
			
			// generate rows for days of holiday
			var obDayCell = obDayRow.insertCell(-1);
			if(parseInt(this.ENTRIES[i]['DAYS_COUNT_DAYS']) < 0)
			{
				obDayCell.className = 'bx-calendar-daysholiday red-daysholiday';
			}
			else
			{
				obDayCell.className = 'bx-calendar-daysholiday';
			}
			var DAYS_COUNT = parseInt(this.ENTRIES[i]['DAYS_COUNT_DAYS']);
			if(DAYS_COUNT > 0)
				obDayCell.innerHTML = DAYS_COUNT;
			else
				obDayCell.innerHTML = "";

			var obDayCellT = obDayRowT.insertCell(-1);
			obDayCellT.className = 'bx-calendar-daysholiday';
			obDayCellT.innerHTML = this.ENTRIES[i]['DAYS_COUNT_REST'];
			// ----------
			
			for (var j = 0; j < yearss; j++)
			{
				var rows = this.obTable.tBodies[0].getElementsByTagName('tr');
				var obRowsS = this.obTable.tBodies[0].rows[j+3];// +1 additional rows with days
				var obCell = obRowsS.insertCell(-1);
				obCell.className = 'bx-calendar-week-day';

				if (cur_date.valueOf() == today.valueOf())
					obCell.className += ' bx-calendar-week-today';
				if (cur_date.getDay() == yearss-1) //( cur_date.getDay() == 0 || )  - Eva: only Sundays? not good
					obCell.className += ' bx-calendar-week-holiday';
				else if(this.SETTINGS.WEEK_HOLIDAYS.length > 0 && this.find(this.SETTINGS.WEEK_HOLIDAYS, cur_date.getDay()) >= 0)
				{
					obCell.className += ' bx-calendar-week-holiday';
				}
				else  if (array_holidays.length > 0)
				{
					if (array_holidays.indexOf(this.GetDateNumeric(cur_date.valueOf())) >= 0 )
					{
						obCell.className += ' bx-calendar-week-holiday';
					}
				}

				if (BX.browser.IsIE())
					obCell.innerHTML = '&nbsp;';

				cur_date.setDate(cur_date.getDate() + 1);
			}
		}
	}

	var padding = 2;
	for (var i = 0; i < (null == this.ENTRIES ? 0 : this.ENTRIES.length); i++)
	{
		var obUserRow = BX('bx_calendar_user_' + this.ENTRIES[i]['ID']);
		if(this.ENTRIES[i]['ADJACENT_POSITIONS_CLOSED'] === 'Y')
		{
			obUserRow.className += ' user_adj_closed';
		}

		if (obUserRow && this.ENTRIES[i]['DATA'])
		{
			var obRowPos = BX.pos(obUserRow, true);

			for (var j = 0; j < this.ENTRIES[i]['DATA'].length; j++)
			{
				var ts_start = this.ENTRIES[i]['DATA'][j]['DATE_ACTIVE_FROM'],
					ts_finish = this.ENTRIES[i]['DATA'][j]['DATE_ACTIVE_TO'];

				this.ENTRIES[i]['DATA'][j].VISUAL = document.createElement('DIV');

				this.ENTRIES[i]['DATA'][j].VISUAL.bx_color_variant = this.ENTRIES[i]['DATA'][j]['TYPE'].length ? this.ENTRIES[i]['DATA'][j]['TYPE'] : 'OTHER';

				this.ENTRIES[i]['DATA'][j].VISUAL.className = 'bx-calendar-entry bx-calendar-color-' + this.ENTRIES[i]['DATA'][j].VISUAL.bx_color_variant;
				this.ENTRIES[i]['DATA'][j].VISUAL.id = 'year-entry-' + i + '-' + j;
				this.ENTRIES[i]['DATA'][j].VISUAL.style.background = this.TYPE_BGCOLORS[(this.ENTRIES[i]['DATA'][j]['TYPE'].length ? this.ENTRIES[i]['DATA'][j]['TYPE'] : 'OTHER')];
				
				if(this.ENTRIES[i]['DATA'][j]['PROPERTY_STATE_VALUE'] != null && this.ADJECT_COLORS[this.ENTRIES[i]['DATA'][j]['PROPERTY_STATE_VALUE']] != null)
				{
					this.ENTRIES[i]['DATA'][j].VISUAL.style.background = this.ADJECT_COLORS[this.ENTRIES[i]['DATA'][j]['PROPERTY_STATE_VALUE']];
					//date was left
					if(today.valueOf() > ts_finish.valueOf())
					{
						this.ENTRIES[i]['DATA'][j].VISUAL.style.background = this.ADJECT_COLORS["FINISHED"];
						this.ENTRIES[i]['DATA'][j].VISUAL.className = this.ENTRIES[i]['DATA'][j].VISUAL.className + ' planning-entry-finished';
					}
				}
				
				if (date_start.valueOf() > ts_start.valueOf())
					ts_start = date_start;
				if (date_finish.valueOf() < ts_finish.valueOf())
					ts_finish = date_finish;

				var startIndex = this.GetDateNumeric(date_start.valueOf() < ts_start.valueOf() ? ts_start.valueOf() : date_start.valueOf()),
				finishIndex = this.GetDateNumeric(date_finish.valueOf() < ts_finish.valueOf() ? date_finish.valueOf() : ts_finish.valueOf());

				var rows = this.obTable.tBodies[0].getElementsByTagName('tr'),
					obStartRow = this.obTable.tBodies[0].rows[startIndex+2],//+1
					obStartRowPos = BX.pos(obStartRow, true),
					start_pos = obStartRowPos.top,
					obFinishRow = this.obTable.tBodies[0].rows[finishIndex+2], // +2 - fix additional rows
					obFinishRowPos = BX.pos(obFinishRow, true),
					finish_pos = obFinishRowPos.bottom;


				var height = parseInt(finish_pos - start_pos - padding);
				if (isNaN(height) || height < 25)
					height = 25;

				this.ENTRIES[i]['DATA'][j].VISUAL.style.left = (obRowPos.left) + 'px';
				this.ENTRIES[i]['DATA'][j].VISUAL.style.top = parseInt(start_pos) + 'px';
				this.ENTRIES[i]['DATA'][j].VISUAL.style.width = (parseInt(obRowPos.width)) + 'px';
				this.ENTRIES[i]['DATA'][j].VISUAL.style.height = parseInt(height) + 'px';

				this.ENTRIES[i]['DATA'][j].VISUAL.innerHTML =
					'<nobr>'
					+ BX.util.htmlspecialchars(this.ENTRIES[i]['DATA'][j]['NAME'])
					+ ' (' + this.ENTRIES[i]['DATA'][j]['DATE_FROM'] + ' - ' + this.ENTRIES[i]['DATA'][j]['DATE_TO'] + ')'
					+ '</nobr>';

				//this.ENTRIES[i]['DATA'][j].VISUAL.onmouseover = this._hightlightRowDiv;
				//this.ENTRIES[i]['DATA'][j].VISUAL.onmouseout = this._unhightlightRowDiv;

				this.ENTRIES[i]['DATA'][j].VISUAL.__bx_user_id = this.ENTRIES[i]['ID'];

				this._parent.MAIN_LAYOUT.appendChild(this.ENTRIES[i]['DATA'][j].VISUAL);
				this._parent.RegisterEntry(this.ENTRIES[i].DATA[j]);

			}
		}
	}

}