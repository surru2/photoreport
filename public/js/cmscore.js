var tasks=[],curdate,period,logged=false,
userLogin=sessionStorage.getItem('userLogin'),
userRole=sessionStorage.getItem('userRole'),
userName=sessionStorage.getItem('userName');

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

$( document ).ready(function() {
	if($('#navUserName'))
		$('#navUserName').html(userName);
	if(userRole>2){
		$('#navSettings').hide();
		$('#navFavorites').hide();
	};
	curdate=moment().format('DD.MM.YYYY');
	period='1.10.18 - 1.10.18';
	if($('#logoutbtn').length){
		getPhotoReport();
	};
	setListenters();
	$('#date-range1').val(moment().startOf('month').format('DD.MM.YYYY')+'-'+moment().format('DD.MM.YYYY'));
});

function showPhoto(task,index){
	$('#getPhotoReportG').hide();
	$('#maincontainer').show();
	let photoBody=
		`
    <style>
        .thumb img {
            -webkit-filter: grayscale(0);
			max-width: 90%;
			max-height: 200px;
            filter: none;
            border-radius: 5px;
            background-color: #fff;
            border: 1px solid #ddd;
            padding: 5px;
        }
        .thumb img:hover {
            -webkit-filter: grayscale(1);
            filter: grayscale(1);
        }
        .thumb {
            padding: 5px;
        }
		.shadow-lg{
			 border-radius: 5px; 
			 border: 1px solid #ddd;			
		};
    </style>
	<div class="container py-2">`;
	photoBody+=`
		<div class="card py-2">
		<span style="color:red" id="photoerrorinfo"></span>
			<div class="card-body">		
				<h5 class="card-title"><a href="http://argusweb.ur.rt.ru:8080/argus/views/wfm/wfmorder/WfmOrderView.xhtml`+task.href+`" target="_blank" id="claimtaskname">`+task.taskname+`</a>&nbsp<a href="https://argus.ural.rt.ru/views/wfm/mobilemounter/order/OrderMobileView.xhtml`+task.href+`" target="_blank">(argus.ural.rt.ru)</a></h5>
				<h6 class="card-subtitle my-2 text-muted">`+task.city+`, `+task.address+`</h6>		
				<p class="card-text">Участок: `+task.worksite;									
				if(task.workeremail!='null'){
					photoBody+=`<br>Исполнитель: <a href="mailto:`+task.workeremail+`">`+task.workername+`</a>`;
				}else{
					photoBody+=`<br>Исполнитель: `+task.workername;
				};												
				photoBody+=`</p>`;
				if(userRole<3){
					photoBody+=`<a class="btn btn-primary" href="#" onclick="updateTaskDiag(tasks[`+index+`]);"><i class="fa fa-thumbs-o-down" aria-hidden="true"></i>&nbsp;Претензия</a>`;
					photoBody+=`<a class="btn btn-primary mx-1" href="#" onclick="acceptTask('`+task.taskname+`');"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i>&nbsp;Подтвердить</a>`;
					photoBody+=`<a class="btn btn-primary mx-1" href="#" onclick="favoriteTask('`+task.taskname+`');" id="favoritebtn" title="Добавить в избранное"><i class="fa fa-star-o" aria-hidden="true"></i></a>`;
					photoBody+=`<a class="btn btn-primary mx-1" href="#" onclick="unfavoriteTask('`+task.taskname+`');" id="unfavoritebtn" title="Убрать из избранного"><i class="fa fa-star" aria-hidden="true"></i></a>`;
				};
				if(userRole>2){
					photoBody+=`<a class="btn btn-primary mx-1" href="#" onclick="fixTask('`+task.taskname+`')"><i class="fa fa-check" aria-hidden="true"></i>&nbsp;Исправлено</a>`;
				};
				photoBody+=`<a class="btn btn-primary mx-1" href="#" onclick="$('#maincontainer').hide();$('#getPhotoReportG').show();"><i class="fa fa-times" aria-hidden="true"></i>&nbsp;Закрыть</a>`;
				photoBody+=`</p>
			</div>
		</div>	
		<div class="row" id="photosplace">	
		</div>
		<div class="card py-1">
			<div class="card-body">`;
				if(task.chiefname){
					photoBody+=`
						<span class="card-title">
						Ответственный по претензии: <b>`+task.chiefname+`</b><br>
						Текст претензии: <b>`+task.claimtext+`</b><br>
						</span>
						`;
				};		
				photoBody+=`
				<p>
				<div id="_comments">
				`;
				if(task.comments){
					for(let i=0;i<task.comments.length;i++)
						photoBody+=`<span class="card-text"><b>`+moment(task.comments[i].commentdate).format('DD.MM.YYYY HH:mm:ss')+` `+task.comments[i].commentname+`</b>: <br>`+task.comments[i].text+`</span><br>`;
				};
				photoBody+=`
				</div>
				</p>
				<div class="form-group shadow-textarea">
					<textarea class="form-control z-depth-1" id="commentText" rows="3" placeholder="Введите текст комментария"></textarea>
				</div>													  
				<div class="btn-group dropright">
					<span class="btn btn-primary" href="#" onclick="setComment();">Отправить</span>
				</div>
			</div>	
		</div>
		
	</div> 
		`;	
	$('#maincontainer').html(photoBody);
	$('#unfavoritebtn').hide();
	blockuiload();
	$.post("/main", {act:'getfavorites'},function(data){
		if(data==="no_session"){
			location.reload();
		}

		data=JSON.parse(data);
		if(data.status==='success'){
			if(data.body.includes(task.taskname)){
				$('#favoritebtn').hide();
				$('#unfavoritebtn').show();
			};
		};
	});	
	$.post("/main", {act:'getphotoscount', bi_id:task.href.match(/\d{9,10}/)[0]},function(data){
		if(data==="no_session"){
			location.reload();
		}
		data=JSON.parse(data);
		if(data.status==='success'){
			var photoBody='',photos=data.body;
			for(let i=0;i<photos.length;i++){
			photoBody+=`
				 <div class="col-md-3 col-sm-4 col-xs-6 thumb shadow-lg m-1 text-center">
					`+moment(photos[i][2]).format('DD.MM.YYYY')+`<br>
					<a data-fancybox="gallery" href="/main?act=getphoto&path=`+photos[i][3]+`" data-caption="`+photos[i][2]+`">
						<img class="img-responsive m-2" src="/main?act=getphoto&path=`+photos[i][3]+`">
					</a>
				  <div class="row">
					<div class="col-md-12">
					  <p class="mx-2" style="font-size:12px;">`+photos[i][1]+`</p>
					</div>
				  </div>
				</div>`;
			};
			$('#photosplace').html(photoBody);
			$.unblockUI();
		}else{
			$.unblockUI();
			$('#photoerrorinfo').html(data.body);
			jrumbleitem($('#photoerrorinfo'));
		};
	});
};

function favoriteTask(taskname){
	$.post("/main", {act:'favoritetask', taskname:taskname},function(data){
		try{
			if(data==="no_session"){
			location.reload();
		}
			data=JSON.parse(data);
			if(data.status==='success'){
				$('#favoritebtn').hide();
				$('#unfavoritebtn').show();
				blockuimessage(data.body);
			}else{
				$("#photoerrorinfo").html(data.body);
				jrumbleitem($("#photoerrorinfo"));
			};
		}catch(err){
			console.log(err);
		};
	});
};

function unfavoriteTask(taskname){
	$.post("/main", {act:'unfavoritetask', taskname:taskname},function(data){
		try{
			if(data==="no_session"){
			location.reload();
		}
			data=JSON.parse(data);
			if(data.status==='success'){
				$('#favoritebtn').show();
				$('#unfavoritebtn').hide();
				blockuimessage(data.body);
			}else{
				$("#photoerrorinfo").html(data.body);
				jrumbleitem($("#photoerrorinfo"));
			};
		}catch(err){
			console.log(err);
		};
	});
};

function filter(words, cellNumber, resetFilter) {
   var table = document.getElementById('photoreportTable');
   for (var r = 1; r < table.rows.length; r++) {
      if (!resetFilter) {
         if (table.rows[r].cells[cellNumber].style.display === 'none') {
            continue
         }
      }
      var cellsV = table.rows[r].cells[cellNumber].innerHTML.replace(/<[^>]+>/g, "");
      for (var i = 0; i < words.length; i++) {
		let valid=0;
		for (var j = 0; j< words.length; j++) {
			if(cellsV.toLowerCase().indexOf(words[j])>=0)
				valid++;
		};
         if (valid){
            displayStyle = '';
         }else {
            displayStyle = 'none';
         }
		 table.rows[r].style.display = displayStyle;
		break;
      }
   }
}

function searchTask(){
	if($('#searchtaskname').val()){
		getPhotoReport($('#searchtaskname').val());
	}else{
		jrumbleitem($('#searchtaskname'))
	};
};

function setComment(){
	if($('#commentText').val()){
		$.post("/main", {act:'setcomment', taskname:$('#claimtaskname').html(), comment: $('#commentText').val()},function(data){
			try{

				if(data==="no_session"){
			location.reload();
		}
				data=JSON.parse(data);
				console.log(data);
				if(data.status==='success'){
					let comments='';
					for(let i=0;i<data.body.length;i++){
						comments+=`<span class="card-text"><b>`+moment(data.body[i].commentdate).format('DD.MM.YYYY HH:mm:ss')+` `+data.body[i].commentname+`</b>: <br>`+data.body[i].text+`</span><br>`;
					};
					$('#_comments').html(comments);
					$('#commentText').val('');
					blockuimessage('Комментарий успешно добавлен');
				}else{
					$("#photoerrorinfo").html(data.body);
					jrumbleitem($("#photoerrorinfo"));
				};
			}catch(err){
				console.log(err);
			};
		});
	}else{
		jrumbleitem($('#commentText'));
	};
};

function showTaskComments(task){
	$('#commentTaskName').html(task[1]);
	$('#commentTaskAddress').html(task[10]+', '+task[2]);
	if(task[8].length)
		$('#commentChiefName').html(moment(task[14]).format('DD.MM.YYYY HH:mm:ss')+' '+task[12]+'писал:');
	$('#commentText').val(task[8]);
	$.blockUI({ message: $('#commentblock'), css: { } });
};

function acceptTask(taskname){
	console.log(taskname);
	$.post("/main", {act:'accepttask', taskname:taskname},function(data){
		try{
			if(data==="no_session"){
				location.reload();
			}
			data=JSON.parse(data);
			if(data.status==='success'){
                $('#maincontainer').hide();
                $('#getPhotoReportG').show();
				// getPhotoReport();
				blockuimessage('Подтверждено');
			}else{
				$("#photoreporttableinfo").html(data.body);
				jrumbleitem($("#photoreporttableinfo"));
			};
		}catch(err){
			console.log(err);
		};
	});
};

function fixTask(taskname){
	console.log(taskname);
	$.post("/main", {act:'fixtask', taskname:taskname},function(data){
		try{
			if(data==="no_session"){
			location.reload();
		}
			data=JSON.parse(data);
			if(data.status==='success'){
				blockuimessage('Отправлено на рассмотрение');
				$('#getPhotoReportG').show();
				$('#maincontainer').hide();
			}else{
				$("#photoreporttableinfo").html(data.body);
				jrumbleitem($("#photoreporttableinfo"));
			};
		}catch(err){
			console.log(err);
		};
	});
};

function claimTask(){
	$.post("/main", {act:'claimtask', taskname:$('#claimtaskname').html(), chieflogin:$('#claimchief option:selected').val(), chiefname:$('#claimchief option:selected').text(), claimtext: $('#claimtext').val()},function(data){
		try{
			if(data==="no_session"){
			location.reload();
		}
			data=JSON.parse(data);
			if(data.status==='success'){
				$('#getPhotoReportG').show();
				$('#maincontainer').hide();
				blockuimessage('Претензия успешно отправлена');
			}else{
				$("#photoreporttableinfo").html(data.body);
				jrumbleitem($("#photoreporttableinfo"));
			};
		}catch(err){
			console.log(err);
		};
	});
};

function getPhotoReport(_taskname,favor){
    let getST = document.documentElement.scrollTop;
    let gebiCC = document.getElementById("currentCoordinates");
	blockuiload();
	let status=[];
	if(localStorage.getItem('Новый')){
		if(localStorage.getItem('Новый')==='true')
			status.push('Новый');
	}else{
		status.push('Новый');
	};
	if(localStorage.getItem('Претензия')){
		if(localStorage.getItem('Претензия')==='true')
			status.push('Претензия');
	}else{
		status.push('Претензия');
	};
	if(localStorage.getItem('Подтверждён')){
		if(localStorage.getItem('Подтверждён')==='true')
			status.push('Подтверждён');
	}else{
		status.push('Подтверждён');
	};
	if(localStorage.getItem('Доработано')){
		if(localStorage.getItem('Доработано')==='true')
			status.push('Доработан');
	}else{
		status.push('Доработан');
	};
	if(localStorage.getItem('Без фото')){
		if(localStorage.getItem('Без фото')==='true')
			status.push('Без фото');
	}else{
		status.push('Без фото');
	};
	if(localStorage.getItem('Высокое затухание')){
		if(localStorage.getItem('Высокое затухание')==='true')
			status.push('Высокое затухание');
	}else{
		status.push('Высокое затухание');
	};
	console.log(status);
	if(_taskname){
		query={act:'getphotoreport', taskname:_taskname, period: period, status: status};
	}else{
		query={act:'getphotoreport', period: period, status: status};
	};
	if(favor)
		query={act:'getphotoreport', favor: favor, period: period, status: status};
	$.post("/main", query,function(data){
		try{
			if(data==="no_session"){
			location.reload();
		}
			data=JSON.parse(data);
			tasks=data.body;
			var _worksite=[],_city=[];
			for(var i=0; i<data.body.length;i++){
				_worksite[i]=data.body[i].worksite.replace('Группа Инсталляторов','ГИ').replace('Группа инсталляторов','ГИ');
				_city[i]=data.body[i].city;
			};
			_worksite = _worksite.filter(onlyUnique);
			_worksite.sort();
			_city = _city.filter(onlyUnique);
			_city.sort();
			let tablebody='';
			tablebody+=`
				  <div class="py-2">
					<div class="container">
					  <div class="row">
						<div class="col-md-16">
						<div class="form-group row">
						  <div class="col-10 col-md-3">
							<input type="email" class="form-control" id="searchtaskname" placeholder="ИН-1234567"> </div>
							<button type="submit" class="btn btn-primary" onclick="searchTask();"><i class="fa fa-search" aria-hidden="true"></i>&nbspПоиск</button>
							<button type="submit" class="btn btn-primary mx-1" onclick="showFilterTable();" id="filterbtn"><i class="fa fa-filter" aria-hidden="true"></i></button>`;
							if(userRole<4){
								tablebody+=`<div class="col-10 col-md-3"><input type="text" id="date-range0" value="`+period+`" class="form-control"></div>`;
								tablebody+=`<button type="submit" class="btn btn-primary mx-1" onclick="location.href = '/main?act=getcsv&period='+period" id="csvbtn"><i class="fa fa-file-excel-o" aria-hidden="true"></i></button>`;
							}else{
								tablebody+=`<div class="col-10 col-md-3" style="display:none;"><input type="text" id="date-range0" value="`+period+`" class="form-control"></div>`;
							};
							tablebody+=`
						</div>				
						<div class="col-md-16 py-1" style="display:none;" id="filterTableDiv">
						  <div class="card">
							<div class="card-header">Выберите необходимые фильтры</div>
							<div class="card-body">
							<div id="statusFilterDiv">
								<h4 style="cursor:pointer" onclick="expandStatusFilters();">Статус: <i class="fa fa-angle-double-down" aria-hidden="true"  id="statusfilterbtn"></i></h4>
								<div id="statusfilterp" style="display:none;">
								<p>`;
						if(userRole<3){
							tablebody+=`
									<div class="form-check form-check-inline">
									  <input type="checkbox" class="form-check-input status filter" id="Новый" checked>
									  <label class="form-check-label" for="Новый">Новый</label>
									</div>
									<div class="form-check form-check-inline">
									  <input type="checkbox" class="form-check-input status filter" id="Подтверждён" checked>
									  <label class="form-check-label" for="Подтверждён">Подтверждён</label>
									</div>
									<div class="form-check form-check-inline">
									  <input type="checkbox" class="form-check-input status filter" id="Доработано" checked>
									  <label class="form-check-label" for="Доработано">Доработано</label>
									</div>	
								`;
							};
							tablebody+=`
									<div class="form-check form-check-inline">
									  <input type="checkbox" class="form-check-input status filter" id="Претензия" checked>
									  <label class="form-check-label" for="Претензия">Претензия</label>
									</div>	
									<div class="form-check form-check-inline">
									  <input type="checkbox" class="form-check-input status filter" id="Без фото" checked>
									  <label class="form-check-label" for="Без фото">Без фото</label>
									</div>		
									<div class="form-check form-check-inline">
									  <input type="checkbox" class="form-check-input status filter" id="Высокое затухание" checked>
									  <label class="form-check-label" for="Высокое затухание">Высокое затухание</label>
									</div>										
									<div class="form-check form-check-inline">
										<button type="submit" class="btn btn-white mx-1" onclick="getPhotoReport();"><i class="fa fa-check" aria-hidden="true"></i>Применить</button>
									</div>										
								</p>
								</div>
								<hr>
							</div>
							  <div class="row">								  
								<div class="col-md-6">
									<h4 style="cursor:pointer" onclick="expandcityfilterbtn();">Города:<i class="fa fa-angle-double-down" aria-hidden="true"  id="cityfilterbtn"></i></h4>
								`;
								tablebody+=`<div id="cityfilterdiv" style="display:none;">`;
								for(let v=0;v<_city.length;v++){
									tablebody+=`												
										<div class="form-check form-check">
										  <input type="checkbox" class="form-check-input city filter" id="`+_city[v]+`" checked>
										  <label class="form-check-label" for="`+_city[v]+`">`+_city[v]+`</label>
										</div>`;
								};
								tablebody+=`
								</div>
								</div>
								<div class="col-md-6">
									<h4 style="cursor:pointer" onclick="expandworksitefilterbtn();">Участки:<i class="fa fa-angle-double-down" aria-hidden="true"  id="worksitefilterbtn"></i></h4>
								`;
								tablebody+=`<div id="worksitefilterdiv" style="display:none;">`;
								for(let v=0;v<_worksite.length;v++){
									tablebody+=`												
										<div class="form-check form-check">
										  <input type="checkbox" class="form-check-input worksite filter" id="`+_worksite[v]+`" checked>
										  <label class="form-check-label" for="`+_worksite[v]+`">`+_worksite[v]+`</label>
										</div>`;
								};
								tablebody+=`
								</div>
								</div>
							  </div>
							</div>
						  </div>
						</div>		
						  <div class="table-responsive">							  
						  <span>Всего инсталляций: `+tasks.length+`</span><br>
						  <span style="color:red" id="photoreporttableinfo"></span>
							<table class="table table-bordered " id="photoreportTable">
							  <thead class="thead-dark">
								<tr>
								  <th>Дата</th>
								  <th>Номер</th>
								  <th>Город</th>
								  <th>Адрес</th>									  
								  <th>Участок</th>
								  <th>Статус</th>
								  <th>Ответственный</th>
								  <th></th>
								</tr>
							  </thead>
							  <tbody>`;
				for(let i=0;i<data.body.length;i++){
					tablebody+=`				<tr>`;
					tablebody+=`				  <td>`+moment(data.body[i].date).format('DD.MM.YYYY')+`</td>`;
					tablebody+=`				  <td><a href="http://argusweb.ur.rt.ru:8080/argus/views/wfm/wfmorder/WfmOrderView.xhtml`+data.body[i].href+`" target="_blank" id="claimtaskname">`+data.body[i].taskname+`</a></td>`;
					tablebody+=`				  <td>`+data.body[i].city+`</td>`;
					tablebody+=`				  <td>`+data.body[i].address+`</td>`;
					tablebody+=`				  <td>`+data.body[i].worksite+`</td>`;
					tablebody+=`				  <td>`+data.body[i].status+`</td>`;
					if(data.body[i].chiefname===undefined) data.body[i].chiefname='';
					tablebody+=`				  <td>`+data.body[i].chiefname+`</td>`;
					tablebody+=`
						<td>
							<div class="btn-group dropleft" style="">
								<button class="btn btn-primary mx-1" onclick="showPhoto(tasks[`+i+`],`+i+`,gebiST)"><i class="fa fa-pencil-square-o" aria-hidden="true"></i>											
								</button>
							</div>
						</td>
					`;
					tablebody+=`				</tr>`;
				};
				tablebody+=`					
							  </tbody>
							</table>
						  </div>
						</div>
					  </div>
					</div>
				  </div>
				 `;
			// $('#maincontainer').html(tablebody);
			$('#getPhotoReportG').html(tablebody);
			/*if(userRole>2)
				$('#statusFilterDiv').hide();*/
			setFilters(period);
			$.unblockUI();
			if(!data.body.length){
				$('#photoreporttableinfo').html('Нет данных за выбранный период');
				jrumbleitem($('#date-range0'));
				jrumbleitem($('#photoreporttableinfo'));
			};
		}catch(err){
			$.unblockUI();
			console.log(err);
		};
	});
};

function expandcityfilterbtn(){
	if($('#cityfilterbtn').hasClass('fa-angle-double-down')){
		$('#cityfilterdiv').slideDown('Slow');
		$('#cityfilterbtn').removeClass('fa-angle-double-down')
		$('#cityfilterbtn').addClass('fa-angle-double-up')
	}else{
		$('#cityfilterdiv').slideUp('Slow');
		$('#cityfilterbtn').removeClass('fa-angle-double-up')
		$('#cityfilterbtn').addClass('fa-angle-double-down')
	};
};

function expandworksitefilterbtn(){
	if($('#worksitefilterbtn').hasClass('fa-angle-double-down')){
		$('#worksitefilterdiv').slideDown('Slow');
		$('#worksitefilterbtn').removeClass('fa-angle-double-down')
		$('#worksitefilterbtn').addClass('fa-angle-double-up')
	}else{
		$('#worksitefilterdiv').slideUp('Slow');
		$('#worksitefilterbtn').removeClass('fa-angle-double-up')
		$('#worksitefilterbtn').addClass('fa-angle-double-down')
	};
};

function expandStatusFilters(){
	if($('#statusfilterbtn').hasClass('fa-angle-double-down')){
		$('#statusfilterp').slideDown('Slow');
		$('#statusfilterbtn').removeClass('fa-angle-double-down')
		$('#statusfilterbtn').addClass('fa-angle-double-up')
	}else{
		$('#statusfilterp').slideUp('Slow');
		$('#statusfilterbtn').removeClass('fa-angle-double-up')
		$('#statusfilterbtn').addClass('fa-angle-double-down')
	};
};

function showFilterTable(){
	filterDiv=$('#filterTableDiv');
	 if(filterDiv.css('display')==='none'){
		filterDiv.css('display','');
	 }else{
		filterDiv.css('display','none')
	 };
};

function getActiveFilters(){
	let activefilters=false;
	$('.form-check-input.filter').each(function(i,elem) {
		if(localStorage.getItem(elem.id)==='false')
			activefilters=true;
	});
	if(activefilters){
		$('#filterbtn').removeClass('btn btn-primary');
		$('#filterbtn').addClass('btn btn-secondary');
	}else{
		$('#filterbtn').removeClass('btn btn-secondary');
		$('#filterbtn').addClass('btn btn-primary');
	};
};

function setFilters(){
	$('#date-range0').dateRangePicker(
	{
	startOfWeek: 'monday',
    	separator : ' - ',
    	format: 'DD.MM.YYYY',
    	autoClose: true,
	}).bind('datepicker-close',function()
	{
		period=this.value;
		getPhotoReport();
	});
	$('#date-range0').val(period);
	let activefilters=false, filtertype;
	$('.form-check-input.filter').each(function(i,elem) {
		if(localStorage.getItem(elem.id)){
			if(localStorage.getItem(elem.id)==='false'){
				activefilters=true;
				filtertype=elem.className;
			};
			let _checked=true;
			if(localStorage.getItem(elem.id)==='true'){
				_checked=true;
			}else if(localStorage.getItem(elem.id)==='false'){
				_checked=false;
			}
			$(elem).prop( "checked", _checked);
		};
	});
	$('.form-check-input.status').on('change',function(){
		localStorage.setItem(this.id, $(this).prop( "checked" ));
	});
	$('.form-check-input.city').on('change',function(){
		localStorage.setItem(this.id, $(this).prop( "checked" ));
		var citys=$('.form-check-input.city:checked'),
		words=[];
		for(let i=0;i<citys.length;i++){
			words.push(citys[i].id.toLowerCase());
		};
		$('.form-check-input.worksite').each(function(i,elem) {
			$(elem).prop( "checked", true);
			localStorage.setItem(elem.id, $(this).prop( "checked" ));
		});
		getActiveFilters();
		filter(words,2);
	});
	$('.form-check-input.worksite').on('change',function(){
		localStorage.setItem(this.id, $(this).prop( "checked" ));
		var worksites=$('.form-check-input.worksite:checked'),
		words=[];
		for(let i=0;i<worksites.length;i++){
			words.push(worksites[i].id.toLowerCase());
		};

		$('.form-check-input.city').each(function(i,elem) {
			$(elem).prop( "checked", true);
			localStorage.setItem(elem.id, $(this).prop( "checked" ));
		});
		getActiveFilters();
		filter(words,4);
	});
	if(activefilters){
		if(filtertype.indexOf('city')>=0){
			var citys=$('.form-check-input.city:checked'),
			words=[];
			for(let i=0;i<citys.length;i++){
				words.push(citys[i].id.toLowerCase());
			};
			console.log(1);
			filter(words,2);
		}else if(filtertype.indexOf('worksite')>=0){
			var worksites=$('.form-check-input.worksite:checked'),
			words=[];
			for(let i=0;i<worksites.length;i++){
				words.push(worksites[i].id.toLowerCase());
			};
			filter(words,4);
		};
		$('#filterbtn').removeClass('btn btn-primary');
		$('#filterbtn').addClass('btn btn-secondary');
	};
};

function updateTaskDiag(task){
	$.post("/main", {act:'getchiefs',worksite:task.worksite},function(data){
		try{
			if(data==="no_session"){
			location.reload();
		}
			data=JSON.parse(data);
			if(data.status==='success'){
				let showUserBody=
					`
				  <div class="py-2">
					<div class="container">
					  <div class="row">
						<div class="col-md-12">
						  <div class="card">
							<div class="card-body">
							  <h5 class="card-title"><a href="http://argusweb.ur.rt.ru:8080/argus/views/wfm/wfmorder/WfmOrderView.xhtml`+task.href+`" target="_blank" id="claimtaskname">`+task.taskname+`</a></h5>
							  <h6 class="card-subtitle my-2 text-muted">`+task.city+`, `+task.address+`</h6>		
								<p class="card-text">Участок: `+task.worksite;
								if(task.workeremail!='null'){
									showUserBody+=`<br>Исполнитель: <a href="mailto:`+task.workeremail+`">`+task.workername+`</a>`;
								}else{
									showUserBody+=`<br>Исполнитель: `+task.workername;
								};
								showUserBody+=`</p>			  
								<div class="form-group row"> <label for="claimchief" class="col-2 col-form-label">Ответственный</label>
								  <div class="col-10">
									<select id="claimchief" class="form-control">`;
									for(let i=0;i<data.body.length;i++){
										if(data.body[i].name===task.chiefname){
											showUserBody+=`<option value="`+data.body[i].login+`" selected>`+data.body[i].name+`</option>`;
										}else{
											showUserBody+=`<option value="`+data.body[i].login+`">`+data.body[i].name+`</option>`;
										};
									};
									if(!task.claimtext)
										task.claimtext='';
									showUserBody+=`
									</select>
								  </div>	
								</div>				  	
								<div class="form-group shadow-textarea">
								  <textarea class="form-control z-depth-1" id="claimtext" rows="3" placeholder="Введите текст претензии" value="">`+task.claimtext+`</textarea>
								</div>
				
							  <div class="btn-group dropright">
								<a class="btn btn-primary" href="#" onclick="claimTask();">Отправить</a>
							  </div><a class="btn btn-primary mx-1" href="#" onclick="$('#maincontainer').hide();$('#getPhotoReportG').show();">Отмена</a>
							</div>
						  </div>
						</div>
					  </div>
					</div>
				  </div>
					`;
				$('#maincontainer').html(showUserBody);
			}else{
				$("#photoerrorinfo").html(data.body);
				jrumbleitem($("#photoerrorinfo"));
			};
		}catch(err){
			console.log(err);
		};
	});
};

function updateUser(){
	if( $('#inputloginnewuser').val() &&  $('#inputnamenewuser').val() &&  $('#inputmailnewuser').val() && $('#inputpasswordnewuser').val()){
		var places=[];
		if($('#inputrolenewuser option:selected').val()==3){
			for(let i=0;i<$('.worksite').length;i++){
			 places.push($('.worksite')[i].innerHTML);
			};
			places=places.filter(onlyUnique);
		}else if($('#inputrolenewuser option:selected').val()==2){
			for(let i=0;i<$('.region').length;i++){
			 places.push($('.region')[i].innerHTML);
			};
			places=places.filter(onlyUnique);
		};
		if(!places.length && $('#inputrolenewuser option:selected').val()>1){
			jrumbleitem($('#addedregions'));
			jrumbleitem($('#addedworksites'));
			return;
		};
		$.post("/main", {
									act:'updateuser',
									login:$('#inputloginnewuser').val(),
									name: $('#inputnamenewuser').val(),
									email:$('#inputmailnewuser').val(),
									password:$('#inputpasswordnewuser').val(),
									filial:$("#inputfilialnewuser option:selected").val(),
									role:$("#inputrolenewuser option:selected").val(),
									places:places
								},function(data){
			try{
				if(data==="no_session"){
			location.reload();
		}
				data=JSON.parse(data);
				if(data.status==='success'){
					showUsers();
				}else{
					$("#createuserinfostatus").html(data.body);
				};
			}catch(err){
				console.log(err);
			};
		});
	}else{
		if(!$('#inputloginnewuser').val())
			jrumbleitem($('#inputloginnewuser'));
		if(!$('#inputnamenewuser').val())
			jrumbleitem($('#inputnamenewuser'));
		if(!$('#inputmailnewuser').val())
			jrumbleitem($('#inputmailnewuser'));
		if(!$('#inputpasswordnewuser').val())
			jrumbleitem($('#inputpasswordnewuser'));
	};
};

function editUser(login){
	$.post("/main", {act:'getuser', login:login},function(data){
		try{
			if(data==="no_session"){
			location.reload();
		}
			data=JSON.parse(data);
			if(data.status==='success'){
                $('#getPhotoReportG').hide();
				data.body=JSON.parse(data.body)
				let showUserBody=
					`
					  <div class="py-5">
						<div class="container">
						  <div class="row">
							<div class="col-md-12">
								<span id="createuserinfostatus" style="color:red"></span>
								<div class="form-group row"> <label for="inputloginnewuser" class="col-2 col-form-label">Логин</label>
								  <div class="col-10">
									<input type="text" class="form-control" id="inputloginnewuser" placeholder="hm_ivanov-ii" value="`+data.body.login+`" disabled> </div>
								</div>			

								<div class="form-group row"> <label for="inputnamenewuser" class="col-2 col-form-label">Имя</label>
								  <div class="col-10">
									<input type="text" class="form-control" id="inputnamenewuser" placeholder="Иванов И.И." value="`+data.body.name+`"> </div>
								</div>	
								
								<div class="form-group row"> <label for="inputmailnewuser" class="col-2 col-form-label">E-mail</label>
								  <div class="col-10">
									<input type="email" class="form-control" id="inputmailnewuser" placeholder="ivanov-ii@ural.rt.ru" value="`+data.body.email+`"> </div>
								</div>
								
								<div class="form-group row"> <label for="inputfilialnewuser" class="col-2 col-form-label">Филиал</label>
								  <div class="col-10">
									<select id="inputfilialnewuser" class="form-control">
										<option value=86>ХМФ</option>
										<option value=66>ЕФ</option>
										<option value=59>ПФ</option>
										<option value=74>ЧФ</option>
										<option value=72>ФТК</option>
										<option value=89>ЯНФ</option>
									</select>
								  </div>	
								</div>				
								
								<div class="form-group row"> <label for="inputrolenewuser" class="col-2 col-form-label">Роль</label>
								  <div class="col-10">				
									<select id="inputrolenewuser" class="form-control">
										<option value=3>Ответственный</option>
										<option value=2>Проверяющий</option>
										<option value=1>Админ РФ</option>
										<option value=0>Суперадмин</option>
									</select>
								  </div>
								</div>						

								<div class="form-group row d-none" id="worksitenewuser"> 
								</div>	
								
								<div class="form-group row d-none" id="regionnewuser"> 
								</div>	

								<div class="form-group row d-none border shadow-sm p-2 mx-1 form-group row" id="addedregions"> 
								</div>	

								<div class="form-group row d-none border shadow-sm p-2 mx-1 form-group row" id="addedworksites"> 
								</div>
								
								<div class="form-group row"> <label for="inputpasswordnewuser" class="col-2 col-form-label">Пароль</label>
								  <div class="col-10">
									<input type="password" name="newuserpassword" autocomplete="off" class="form-control" id="inputpasswordnewuser" placeholder="Пароль" value="`+data.body.password+`"> </div>
								</div>
								
								<button class="btn btn-primary" onclick="updateUser();"><i class="fa fa-check-circle" aria-hidden="true"></i>&nbsp;Применить</button>
								<button class="btn btn-primary" onclick="showUsers();"><i class="fa fa-times" aria-hidden="true"></i>&nbsp;Отмена</button>
							</div>
						  </div>
						</div>
					  </div>
					`;
				$('#maincontainer').html(showUserBody);
				$('#inputfilialnewuser option[value="'+data.body.filial+'"]').attr('selected','selected');
				$('#inputrolenewuser option[value='+data.body.role+']').attr('selected','selected');
				if($('#inputrolenewuser option:selected').val()==3){
					if(data.body.places){
						for(let i=0;i<data.body.places.length;i++){
							$('#addedworksites').append(`
								<div class="border shadow-sm m-1" style="cursor:pointer" onclick="this.remove()"><span class="worksite">`+data.body.places[i]+`</span><i class="fa fa-times" aria-hidden="true"></i></div>
							`);
						};
					};
					$('#addedworksites').removeClass('d-none');
					$('#worksitenewuser').removeClass('d-none');
				}else if($('#inputrolenewuser option:selected').val()==2){
					if(data.body.places){
						for(let i=0;i<data.body.places.length;i++){
							$('#addedregions').append(`
								<div class="border shadow-sm m-1" style="cursor:pointer" onclick="this.remove()"><span class="region">`+data.body.places[i]+`</span><i class="fa fa-times" aria-hidden="true"></i></div>
							`);
						};
					};
					$('#addedregions').removeClass('d-none');
					$('#regionnewuser').removeClass('d-none');
				};
				getregions();
				$('#inputfilialnewuser').on('change', function() {
					getregions();
				});
				$('#inputrolenewuser').on('change', function() {
					if($('#inputrolenewuser option:selected').val()==3){
						$('#worksitenewuser').removeClass('d-none');
						$('#regionnewuser').addClass('d-none');
						$('#addedworksites').removeClass('d-none');
						$('#addedregions').addClass('d-none');
					};
					if($('#inputrolenewuser option:selected').val()==2){
						$('#worksitenewuser').addClass('d-none');
						$('#regionnewuser').removeClass('d-none');
						$('#addedworksites').addClass('d-none');
						$('#addedregions').removeClass('d-none');
					};
					if($('#inputrolenewuser option:selected').val()<2){
						$('#worksitenewuser').addClass('d-none');
						$('#regionnewuser').addClass('d-none');
						$('#addedregions').addClass('d-none');
						$('#addedworksites').addClass('d-none');
					};
				});
			}else{
				if(data.status==='fail'){
					$('#userstableinfo').html(data.body);
					jrumbleitem($('#userstableinfo'));
				};
			};
		}catch(err){
			console.log(err);
		};
	});
};

function blockuiload(){
    $.blockUI({
	message:'<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>',
	css: {
        border: 'none',
        padding: '15px',
        backgroundColor: '#000',
        '-webkit-border-radius': '10px',
        '-moz-border-radius': '10px',
        opacity: .5,
        color: '#fff'
    } });
};

function blockuimessage(message){
	$.blockUI({
		message: '<i class="fa fa-check-circle-o" aria-hidden="true"></i> '+message,
		fadeIn: 700,
		fadeOut: 700,
		timeout: 2000,
		showOverlay: false,
		centerY: false,
		css: {
			width: '350px',
			top: '15%',
			left: '',
			right: '10px',
			border: 'none',
			padding: '5px',
			backgroundColor: '#000',
			'-webkit-border-radius': '10px',
			'-moz-border-radius': '10px',
			opacity: .6,
			color: '#fff'
		}
	});
};

function deleteUser(login){
	$.post("/main", {act:'deleteuser', login:login},function(data){
		try{
			if(data==="no_session"){
			location.reload();
		}
			data=JSON.parse(data);
			if(data.status==='success'){
				showUsers();
			}else{
				if(data.status==='fail'){
					$('#userstableinfo').html(data.body);
					jrumbleitem($('#userstableinfo'));
				};
			};
		}catch(err){
			console.log(err);
		};
	});
};

function createUser(){
	if( $('#inputloginnewuser').val() &&  $('#inputnamenewuser').val() &&  $('#inputmailnewuser').val() && $('#inputpasswordnewuser').val()){
		var places=[];
		if($('#inputrolenewuser option:selected').val()==3){
			for(let i=0;i<$('.worksite').length;i++){
			 places.push($('.worksite')[i].innerHTML);
			};
			places=places.filter(onlyUnique);
		}else if($('#inputrolenewuser option:selected').val()==2){
			for(let i=0;i<$('.region').length;i++){
			 places.push($('.region')[i].innerHTML);
			};
			places=places.filter(onlyUnique);
		};
		if(!places.length && $('#inputrolenewuser option:selected').val()>1){
			jrumbleitem($('#addedregions'));
			jrumbleitem($('#addedworksites'));
			return;
		};
		$.post("/main", {
									act:'createuser',
									login:$('#inputloginnewuser').val(),
									name: $('#inputnamenewuser').val(),
									email:$('#inputmailnewuser').val(),
									password:$('#inputpasswordnewuser').val(),
									filial:$("#inputfilialnewuser option:selected").val(),
									role:$("#inputrolenewuser option:selected").val(),
									places:places
								},function(data){
			console.log(3);
			try{
				if(data==="no_session"){
			location.reload();
		}
				data=JSON.parse(data);
				if(data.status==='success'){
					showUsers();
				}else{
					$("#createuserinfostatus").html(data.body);
				};
			}catch(err){
				console.log(err);
			};
		});
	}else{
		if(!$('#inputloginnewuser').val())
			jrumbleitem($('#inputloginnewuser'));
		if(!$('#inputnamenewuser').val())
			jrumbleitem($('#inputnamenewuser'));
		if(!$('#inputmailnewuser').val())
			jrumbleitem($('#inputmailnewuser'));
		if(!$('#inputpasswordnewuser').val())
			jrumbleitem($('#inputpasswordnewuser'));
	};
};

function newUserForm(){
let newUserBody=
	`
	  <div class="py-5">
		<div class="container">
		  <div class="row">
			<div class="col-md-12">
				<span id="createuserinfostatus" style="color:red"></span>
				<div class="form-group row"> <label for="inputloginnewuser" class="col-2 col-form-label">Логин</label>
				  <div class="col-10">
					<input type="text" class="form-control" id="inputloginnewuser" placeholder="hm_ivanov-ii"> </div>
				</div>			

				<div class="form-group row"> <label for="inputnamenewuser" class="col-2 col-form-label">Имя</label>
				  <div class="col-10">
					<input type="text" class="form-control" id="inputnamenewuser" placeholder="Иванов И.И."> </div>
				</div>	
				
				<div class="form-group row"> <label for="inputmailnewuser" class="col-2 col-form-label">E-mail</label>
				  <div class="col-10">
					<input type="email" class="form-control" id="inputmailnewuser" placeholder="ivanov-ii@ural.rt.ru"> </div>
				</div>
				
				<div class="form-group row"> <label for="inputfilialnewuser" class="col-2 col-form-label">Филиал</label>
				  <div class="col-10">
					<select id="inputfilialnewuser" class="form-control">
						<option value=86 selected>ХМФ</option>
						<option value=66>ЕФ</option>
						<option value=59>ПФ</option>
						<option value=74>ЧФ</option>
						<option value=72>ФТК</option>
						<option value=89>ЯНФ</option>
					</select>
				  </div>	
				</div>				
				
				<div class="form-group row"> <label for="inputrolenewuser" class="col-2 col-form-label">Роль</label>
				  <div class="col-10">				
					<select id="inputrolenewuser" class="form-control">
						<option value=3>Ответственный</option>
						<option value=2>Проверяющий</option>
						<option selected value=1>Админ РФ</option>
						<option value=0>Суперадмин</option>
					</select>
				  </div>
				</div>						

				<div class="form-group row d-none" id="worksitenewuser"> 
				</div>	
				
				<div class="form-group row d-none" id="regionnewuser"> 
				</div>	

				<div class="form-group row d-none border shadow-sm p-2 mx-1 form-group row" id="addedregions"> 
				</div>	

				<div class="form-group row d-none border shadow-sm p-2 mx-1 form-group row" id="addedworksites"> 
				</div>					
				
				<div class="form-group row"> <label for="inputpasswordnewuser" class="col-2 col-form-label">Пароль</label>
				  <div class="col-10">
					<input type="password" class="form-control" id="inputpasswordnewuser" placeholder="Пароль"> </div>
				</div>
				
				<button class="btn btn-primary" onclick="createUser();"><i class="fa fa-check-circle" aria-hidden="true"></i>&nbsp;Создать</button>
				<button class="btn btn-primary" onclick="showUsers();"><i class="fa fa-times" aria-hidden="true"></i>&nbsp;Отмена</button>
			</div>
		  </div>
		</div>
	  </div>
	`;
	$('#maincontainer').html(newUserBody);
	getregions();
	$('#inputfilialnewuser').on('change', function() {
		getregions();
	});
	$('#inputrolenewuser').on('change', function() {
		if($('#inputrolenewuser option:selected').val()==3){
			$('#worksitenewuser').removeClass('d-none');
			$('#regionnewuser').addClass('d-none');
			$('#addedworksites').removeClass('d-none');
			$('#addedregions').addClass('d-none');
		};
		if($('#inputrolenewuser option:selected').val()==2){
			$('#worksitenewuser').addClass('d-none');
			$('#regionnewuser').removeClass('d-none');
			$('#addedworksites').addClass('d-none');
			$('#addedregions').removeClass('d-none');
		};
		if($('#inputrolenewuser option:selected').val()<2){
			$('#worksitenewuser').addClass('d-none');
			$('#regionnewuser').addClass('d-none');
			$('#addedregions').addClass('d-none');
			$('#addedworksites').addClass('d-none');
		};
	});
};

function getregions(){
	$.post("/main", {act:'getregions', region:$('#inputfilialnewuser option:selected').val()},function(data){
		if(data==="no_session"){
			location.reload();
		}
		data=JSON.parse(data);
		if(data.status==='success'){
			setselectworksites(data.worksites);
			setselectregions(data.regions);
		}else{
			$('#createuserinfostatus').html(data.body);
		};
	});
};

function addregion(){
	var arr=[];
	$("#forregionslistbox option").each(function()
	{
		arr.push($(this).val());
	});
	if(arr.includes($("#inputregionnewuser").val())){
		$('#addedregions').append(`
			<div class="border shadow-sm m-1" style="cursor:pointer" onclick="this.remove()"><span class="region">`+$('#inputregionnewuser').val()+`</span><i class="fa fa-times" aria-hidden="true"></i></div>
		`);
		$("#inputregionnewuser").val('');
		$("#createuserinfostatus").html('');
	}else{
		$("#createuserinfostatus").html('Данного региона не существует');
		$("#inputregionnewuser").val('');
		jrumbleitem($('#inputregionnewuser'));
		jrumbleitem($('#createuserinfostatus'));
	};
};

function addworksite(){
	var arr=[];
	$("#forworksitelistbox option").each(function()
	{
		arr.push($(this).val());
	});
	if(arr.includes($("#inputworksitenewuser").val())){
		$('#addedworksites').append(`
			<div class="border shadow-sm m-1" style="cursor:pointer" onclick="this.remove()"><span class="worksite">`+$('#inputworksitenewuser').val()+`</span><i class="fa fa-times" aria-hidden="true"></i></div>
		`);
		$("#inputworksitenewuser").val('');
		$("#createuserinfostatus").html('');
	}else{
		$("#createuserinfostatus").html('Данного участка не существует');
		$("#inputworksitenewuser").val('');
		jrumbleitem($('#inputworksitenewuser'));
		jrumbleitem($('#createuserinfostatus'));
	};
};

function setselectworksites(worksites){
	var worksitebody=`
	<label for="inputworksitenewuser" class="col-2 col-form-label">Участки</label>
	<div class="col-4">	
	<input type="text" list="forworksitelistbox" id="inputworksitenewuser" class="form-control" placeholder="Введите название участка">
	<datalist id="forworksitelistbox">`;
	for(let i=0;i<worksites.length;i++){
		worksitebody+='<option>'+worksites[i].WORKSITE_NAME+'</option>';
	};
	worksitebody+=`
	</datalist>
	</div>
	<button class="btn btn-primary" onclick="addworksite();"><i class="fa fa-plus" aria-hidden="true"></i>&nbsp;Добавить</button>
	`;
	$('#worksitenewuser').html(worksitebody);
};

function setselectregions(regions){
	var regionsbody=`
	<label for="inputregionnewuser" class="col-2 col-form-label">Регионы</label>	
	<div class="col-4">	
	<input type="text" list="forregionslistbox" id="inputregionnewuser" class="form-control" placeholder="Введите название региона">	
	<datalist id="forregionslistbox">	
	`;
	for(let i=0;i<regions.length;i++){
		regionsbody+='<option>'+regions[i].REGION_TREE_NAME+'</option>';
	};
	regionsbody+=`
	</datalist>	
	</div>
	<button class="btn btn-primary" onclick="addregion();"><i class="fa fa-plus" aria-hidden="true"></i>&nbsp;Добавить</button>
	`;
	$('#regionnewuser').html(regionsbody);
};

function showUsers(){
	blockuiload();
	$.post("/main", {act:'getusers'},function(data){
		try{
			if(data==="no_session"){
			location.reload();
		}
			data=JSON.parse(data);
			if(data.status==='success'){
				let tablebody='';
				tablebody+=`
					  <div class="py-2">
						<div class="container">
						  <div class="row">
							<div class="col-md-12">
								<div class="form-group row">
									<div class="col-10 col-md-3">
										<button type="submit" class="btn btn-primary mx-1" onclick="newUserForm();"><i class="fa fa-address-card" aria-hidden="true"></i>Добавить</button>
										<button type="submit" class="btn btn-primary mx-1" onclick="location.href = '/main?act=getuserscsv'"><i class="fa fa-file-excel-o" aria-hidden="true"></i></button>
									</div>
								</div>
							  <div class="table-responsive">
							  <span style="color:red" id="userstableinfo"></span>
								<table class="table table-bordered ">
								  <thead class="thead-dark">
									<tr>
									  <th>Логин</th>
									  <th>Роль</th>
									  <th>Имя</th>
									  <th>Филиал</th>
									  <th>Дата</th>
									  <th></th>
									</tr>
								  </thead>
								  <tbody>`;
					for(let i=0;i<data.body.length;i++){
						let role;
						switch (data.body[i].role){
							case 0:role='Суперадмин';break;
							case 1:role='Админ РФ';break;
							case 2:role='Проверяющий';break;
							case 3:role='Ответственный';break;
						};
						let _filial;
						switch (data.body[i].filial){
							case '86':_filial='ХМФ';break;
							case '66':_filial='ЕФ';break;
							case '59':_filial='ПФ';break;
							case '74':_filial='ЧФ';break;
							case '72':_filial='ФТК';break;
							case '89':_filial='ЯНФ';break;
						};
						tablebody+=`				<tr>`;
						tablebody+=`				  <td>`+data.body[i].login+`</td>`;
						tablebody+=`				  <td>`+role+`</td>`;
						tablebody+=`				  <td>`+data.body[i].name+`</td>`;
						tablebody+=`				  <td>`+_filial+`</td>`;
						tablebody+=`				  <td>`+moment(data.body[i].date).format('DD.MM.YYYY')+`</td>`;
						tablebody+=`
							<td>
								<div class="btn-group dropleft" style="">
									<button class="btn btn-primary dropdown-toggle" data-toggle="dropdown"><i class="fa fa-pencil-square-o" aria-hidden="true"></i>&nbsp;</button>
									<div class="dropdown-menu"> <a class="dropdown-item" href="#" onclick="editUser('`+data.body[i].login+`');">Редактировать</a>
										<a class="dropdown-item" href="#" onclick="deleteUser('`+data.body[i].login+`');">Удалить</a>
									</div>
								</div>
							</td>
						`;
						tablebody+=`				</tr>`;
					};
					tablebody+=`
								  </tbody>
								</table>
							  </div>
							</div>
						  </div>
						</div>
					  </div>
					 `;
				$('#maincontainer').html(tablebody);
				$.unblockUI();
			}
		}catch(err){
			$.unblockUI;
			console.log(err);
		};
	});
};

function clearLogonForm(){
	$('#logininput').val('');
	$('#passwordinput').val('');
};

function setListenters(){
	$('#logoutbtn').on('click',function(){
		$.post("/main", {act:'logout'},function(data){
			try{
				if(data==="no_session"){
			location.reload();
		}
				data=JSON.parse(data);
				if(data.loginstatus==='logout'){
					location.reload();
				}
			}catch(err){
				console.log(err);
			};
		});
	});

	$('#logonbtn').on('click',function(){
		$.post("/main", {act:'login', login: $('#logininput').val(), password: $('#passwordinput').val()},function(data){
			try{
				if(data==="no_session"){
					location.reload();
				}
				data=JSON.parse(data);
				if(data.loginstatus==='success'){
					sessionStorage.setItem('userLogin',data.login);
					sessionStorage.setItem('userRole',data.role);
					sessionStorage.setItem('userName',data.name);
					location.reload();
				}else{
					$('#logonstatus').html('Неверный логин или пароль');
					 jrumbleitem($('#logonstatus'));
					 clearLogonForm();
				};
			}catch(err){
				$('#logonstatus').html('Неизвестная ошибка, попробуйте позже');
				jrumbleitem($('#logonstatus'));
				clearLogonForm();
			};		
		});
	});

	$('#settingsbtn').on('click',function(){
		showUsers();	
	});

	$('#getphotoreport').on('click',function(){
		getPhotoReport();
	});	
	
	$('#favoritesbtn').on('click',function(){
		getPhotoReport('',true);
	});	
	
	$('#getmaterials').on('click',function(){
		$.blockUI({ message: $('#materialdiag'), css: { width: '275px' } }); 
	});
	
};

function getMaterials(period){
	console.log(period);
	location.href="/main?act=getmaterials&period="+period;
	$.unblockUI();
};

function jrumbleitem(elem){
	var demoTimeout;
	$(elem).jrumble({
		x: 2,
		y: 2,
		rotation: 1
	});
	clearTimeout(demoTimeout);
	$(elem).trigger('startRumble');
	demoTimeout = setTimeout(function(){$(elem).trigger('stopRumble');}, 500);
};
