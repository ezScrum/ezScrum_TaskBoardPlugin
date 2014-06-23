Ext.ns('EzScrum.Plugin.TaskBoard.Config.DragDrop');

// A DropZone which cooperates with DragZones whose dragData contains
// a "field" property representing a form Field. Fields may be dropped onto
// grid data cells containing a matching data type.
EzScrum.Plugin.TaskBoard.Config.DragDrop.PanelFieldDropZone = Ext.extend(Ext.dd.DropZone, {
    constructor: function( h, t, containerID ){
    	this.headFixItemLength = h;
    	this.tailFixItemLength = t;
    },
	//  Call the DropZone constructor using the View's scrolling element
	//  only after the grid has been rendered.
    init: function(panel) {	 
    	// 存ID等需要抓元件時再抓，否則直接抓panel只會存有當下的狀態(類似clone, 而不是call by ref.)
    	this.containerPanelID = panel.id;
    	
        if (panel.rendered) {
        	EzScrum.Plugin.TaskBoard.Config.DragDrop.PanelFieldDropZone.superclass.constructor.call(this, panel.getEl());
            var i = Ext.fly(panel.getEl());
            i.unselectable();
        } else {
            panel.on('afterlayout', this.init, this, {single: true});
        }
    },
	//  Scroll the main configured Element when we drag close to the edge
    containerScroll: true,

    // 提供事件的參數 "target", 設定為 manageStagePanel(最外層的 panel)
    getTargetFromEvent: function(e) {
       return Ext.getCmp(this.containerPanelID);
    },
	//  On Node enter, see if it is valid for us to drop the field on that type of column.
    // 點擊 panel 準備要拖拉的進入點
    onNodeEnter: function(target, dd, e, dragData) {
    	
        delete this.dropOK;
        if (!target) {
            return;
        }
		//  Check that a field is being dragged.
        var f = dragData.field;
        if (!f) {
            return;
        }
        this.dropOK = true;
        Ext.fly(target).addClass('x-drop-target-active');
    },
	//  Return the class name to add to the drag proxy. This provides a visual indication
	//  of drop allowed or not allowed.
    // 拖拉狀態下查看拖拉的座標以調整UI
    onNodeOver: function(target, dd, e, dragData) {
    	var dragStage = dragData.field;
    	
    	// 在自己panel範圍內的話, 不做動作
    	if ( ( dragStage.getEl().getLeft()   < e.getXY()[0] &&
    		   dragStage.getEl().getRight()  > e.getXY()[0] &&
    		   dragStage.getEl().getTop()    < e.getXY()[1] &&
    		   dragStage.getEl().getBottom() > e.getXY()[1]  ) )
   		{
    		return this.dropNotAllowed;
   		}
    	
    	// 拖拉的panel屬於哪一層級, 以控制可拖拉的範圍
    	var ddLevel = dragStage.level;
    	
    	if( ddLevel == 1 ){
    		var stageAmount = target.items.length;
        	// 判斷拖曳位置去頭尾(Story, Not Checked Out, Done)
            for( var i = this.headFixItemLength; i < stageAmount - this.tailFixItemLength; i = i + 1)
            {
            	var stage = target.get(i);// 取得 stage
            	
            	// 拖曳至同位置則不進入, 位置不變
            	if (stage.id != dragStage.id)
            	{
            		// 有 subStage
            		var subStageAmount = stage.items.length;
            		if( subStageAmount != undefined && subStageAmount > 0 ){
            			for( var j = 0; j < subStageAmount; j++ ){
            				var subStage = stage.get(j); // 取得 subStage
            				// 判斷拖曳項目是否拖曳至此項目位置
                        	if ( subStage.getEl().getLeft() < e.getXY()[0] &&
                        		 subStage.getEl().getRight() > e.getXY()[0] &&
                        		 subStage.getEl().getTop() < e.getXY()[1] &&
                        		 subStage.getEl().getBottom() > e.getXY()[1])
                       		{
                        		return this.dropNotAllowed;
                       		}
            			}
            		}
            		
                	// 判斷拖曳項目是否拖曳至此 stage 位置
                	if ( stage.getEl().getLeft()   < e.getXY()[0] &&
                		 stage.getEl().getRight()  > e.getXY()[0] &&
                		 stage.getEl().getTop()    < e.getXY()[1] &&
                		 stage.getEl().getBottom() > e.getXY()[1]   )
               		{
               				return this.dropAllowed;
               		}
       			}
            }
    	}
    	else if( ddLevel == 2 ){
    		
    		var parentID = dragStage.id.slice( 0, 2 )+"0"; 

    		var stageAmount = target.items.length;
        	// 判斷 subStage 在 parent panel 底下才能拖曳, 順便先去頭尾(Story, Not Checked Out, Done)
            for( var i = this.headFixItemLength; i < stageAmount - this.tailFixItemLength; i = i + 1)
            {
            	var stage = target.get(i);// 取得 stage
            	
            	// 找到對應的 parent panel 才去判斷可否移至其他 subStage
            	if( stage.id == parentID ){
            		var subStageAmount = stage.items.length;
        			for( var j = 0; j < subStageAmount; j++ ){
        				var subStage = stage.get(j); // 取得 subStage
        				
        				// 在其他 subStage 內才能移動
        				if( dragStage.id != subStage.id ){
        					// 判斷拖曳項目是否拖曳至此項目位置
        					if ( subStage.getEl().getLeft() < e.getXY()[0] &&
        							subStage.getEl().getRight() > e.getXY()[0] &&
        							subStage.getEl().getTop() < e.getXY()[1] &&
        							subStage.getEl().getBottom() > e.getXY()[1])
        					{
        						return this.dropAllowed;
        					}
        				}
        				
        			}
            	}
            }
    	}
    },
	//  Process the drop event if we have previously ascertained that a drop is OK.
    // 拖拉stage放開時所觸發的事件
    onNodeDrop: function(target, dd, e, dragData) {
    	var dragStage = dragData.field;
    	
    	// 在自己panel範圍內的話, 不做動作
    	if ( ( dragStage.getEl().getLeft()   < e.getXY()[0] &&
    		   dragStage.getEl().getRight()  > e.getXY()[0] &&
    		   dragStage.getEl().getTop()    < e.getXY()[1] &&
    		   dragStage.getEl().getBottom() > e.getXY()[1]  ) )
   		{
    		return;
   		}
    	
    	// 拖拉的panel屬於哪一層級, 以控制可拖拉的範圍
    	var ddLevel = dragStage.level;
    	
    	if( ddLevel == 1 ){
    		var stageAmount = target.items.length;
        	// 判斷拖曳位置去頭尾(Story, Not Checked Out, Done)
            for( var i = this.headFixItemLength; i < stageAmount - this.tailFixItemLength; i = i + 1)
            {
            	var stage = target.get(i);// 取得 stage
            	
            	// 拖曳至同位置則不進入, 位置不變
            	if (stage.getId() != dragStage.getId())
            	{
            		// 有 subStage
            		var subStageAmount = stage.items.length;
            		if( subStageAmount != undefined && subStageAmount > 0 ){
            			for( var j = 0; j < subStageAmount; j++ ){
            				var subStage = stage.get(j); // 取得 subStage
            				// 判斷拖曳項目是否拖曳至此項目位置
                        	if ( subStage.getEl().getLeft() < e.getXY()[0] &&
                        		 subStage.getEl().getRight() > e.getXY()[0] &&
                        		 subStage.getEl().getTop() < e.getXY()[1] &&
                        		 subStage.getEl().getBottom() > e.getXY()[1])
                       		{
                        		return;
                       		}
            			}
            		}
            		
                	// 判斷拖曳項目是否拖曳至此 stage 位置
                	if ( stage.getEl().getLeft()   < e.getXY()[0] &&
                		 stage.getEl().getRight()  > e.getXY()[0] &&
                		 stage.getEl().getTop()    < e.getXY()[1] &&
                		 stage.getEl().getBottom() > e.getXY()[1]   )
               		{
                		handlePanelDragDrop_TaskBoard( target, ddLevel, dragStage.id, stage.id );
               		}
       			}
            }
    	}
    	else if( ddLevel == 2 ){
    		
    		var parentID = dragStage.id.slice( 0, 2 )+"0"; 

    		var stageAmount = target.items.length;
        	// 判斷 subStage 在 parent panel 底下才能拖曳, 順便先去頭尾(Story, Not Checked Out, Done)
            for( var i = this.headFixItemLength; i < stageAmount - this.tailFixItemLength; i = i + 1)
            {
            	var stage = target.get(i);// 取得 stage
            	
            	// 找到對應的 parent panel 才去判斷可否移至其他 subStage
            	if( stage.id == parentID ){
            		var subStageAmount = stage.items.length;
        			for( var j = 0; j < subStageAmount; j++ ){
        				var subStage = stage.get(j); // 取得 subStage
        				
        				// 在其他 subStage 內才能移動
        				if( dragStage.id != subStage.id ){
        					// 判斷拖曳項目是否拖曳至此項目位置
        					if ( subStage.getEl().getLeft() < e.getXY()[0] &&
        							subStage.getEl().getRight() > e.getXY()[0] &&
        							subStage.getEl().getTop() < e.getXY()[1] &&
        							subStage.getEl().getBottom() > e.getXY()[1])
        					{
        						handlePanelDragDrop_TaskBoard( target, ddLevel, dragStage.id, subStage.id );
        					}
        				}
        				
        			}
            	}
            }
    	}
    }
});

//  A class which makes Fields within a Panel draggable.
//  the dragData delivered to a coooperating DropZone's methods contains
//  the dragged Field in the property "field".
EzScrum.Plugin.TaskBoard.Config.DragDrop.PanelFieldDragZone = Ext.extend(Ext.dd.DragZone, {
	constructor: function(h, t){
    	this.headFixItemLength = h;
    	this.tailFixItemLength = t;
    },
	//  Call the DRagZone's constructor. The Panel must have been rendered.
    init: function(panel) {
    	// 存ID等需要抓元件時再抓，否則直接抓panel只會存有當下的狀態(類似clone, 而不是call by ref.)
    	this.containerPanelID = panel.id;
    	
        if (panel.nodeType) {
        	EzScrum.Plugin.TaskBoard.Config.DragDrop.PanelFieldDragZone.superclass.init.apply(this, arguments);
        } else {
            if (panel.rendered) {
            	EzScrum.Plugin.TaskBoard.Config.DragDrop.PanelFieldDragZone.superclass.constructor.call(this, panel.getEl());
                var i = Ext.fly(panel.getEl());
                i.unselectable();
            } else {
                panel.on('afterlayout', this.init, this, {single: true});
            }
        }
    },
    scroll: false,
	//  On mousedown, we ascertain whether it is on one of our draggable Fields.
	//  If so, we collect data about the draggable object, and return a drag data
	//  object which contains our own data, plus a "ddel" property which is a DOM
	//  node which provides a "view" of the dragged data.
    getDragData: function(e) {
    	var isSprintOverdue = Ext.getCmp( this.containerPanelID ).isSprintOverdue;
    	
    	// 最外層的 Panel
    	var containerPanel = Ext.getCmp(this.containerPanelID);
    	
    	// 以 click 的 coordinate 找出被 Drag 的 Panel(不包含固定欄位 Story, Not Checked Out, Done)
    	var dragPanel;
    	for ( i = this.headFixItemLength; i < containerPanel.items.length - this.tailFixItemLength; i++ )
        {
    		// stage at level one
    		var stage = containerPanel.get(i);
    		
    		// subStage amount
    		var subStageAmount = stage.items.length;

    		if( subStageAmount != 0 )
    		{
    			for( j = 0; j < subStageAmount; j++ )
    			{
    				// stage at level two
    				var subStage = stage.items.get(j);
    				
    				// find the clicked coordinate at subStage panel or not
    				if( subStage.getEl().getLeft() < e.getXY()[0] &&
						subStage.getEl().getRight() > e.getXY()[0] &&
						subStage.getEl().getTop() < e.getXY()[1] &&
						subStage.getEl().getBottom() > e.getXY()[1]) 
        			{
        				dragPanel = subStage;
        				dragPanel.containerPositionLeft = subStage.getEl().getLeft(); 
        				dragPanel.containerPositionRight = subStage.getEl().getRight(); 
        				dragPanel.containerPositionTop = subStage.getEl().getTop(); 
        				dragPanel.containerPositionBottom = subStage.getEl().getBottom(); 
        				
        				handlePanelClick_TaskBoard( this.containerPanelID, dragPanel, isSprintOverdue, this.headFixItemLength, this.tailFixItemLength );
        				break;
        			}
    			}
    		}
    		// if drag panel is not undefined, break out for loop
    		if(dragPanel){
				break; 
			}
    		
    		// find the clicked coordinate at stage panel
			if( stage.getEl().getLeft() < e.getXY()[0] &&
				stage.getEl().getRight() > e.getXY()[0] &&
				stage.getEl().getTop() < e.getXY()[1] &&
				stage.getEl().getBottom() > e.getXY()[1]) 
			{
				dragPanel = stage;
				dragPanel.containerPositionLeft = stage.getEl().getLeft(); 
				dragPanel.containerPositionRight = stage.getEl().getRight(); 
				dragPanel.containerPositionTop = stage.getEl().getTop(); 
				dragPanel.containerPositionBottom = stage.getEl().getBottom(); 
				
				handlePanelClick_TaskBoard( this.containerPanelID, dragPanel, isSprintOverdue, this.headFixItemLength, this.tailFixItemLength );
				break;
			}
        }
    	// if sprint is overdue, disable to go on.
    	if( isSprintOverdue ){
    		Ext.Msg.alert('Overdue', 'This sprint is overdue');
    		return;
    	}
        if (dragPanel) {
            e.stopEvent();
			//  Ugly code to "detach" the drag gesture from the input field.
			//  Without this, Opera never changes the mouseover target from the input field
			//  even when dragging outside of the field - it just keeps selecting.
            if (Ext.isOpera) {
                Ext.fly(dragPanel).on('mousemove', function(e1){
                    dragPanel.style.visibility = 'hidden';
                    (function(){
                        dragPanel.style.visibility = '';
                    }).defer(1);
                }, null, {single:true});
            }

			//  create a drag item to display
            Ext.fly(dragPanel.el.dom).setWidth(dragPanel.getEl().getWidth());
            return {
                field: dragPanel,
                ddel: dragPanel.el.dom
            };
        }
    },
	//  The coordinates to slide the drag proxy back to on failed drop.
    getRepairXY: function() {
        return this.dragData.field.getEl().getXY();
    }
});

//處理Stage Panel選取
function handlePanelClick_TaskBoard( containerPanelID, panel, isSprintOverdue, headFixItemLength, tailFixItemLength ) {
	var containerPanel = Ext.getCmp( containerPanelID );
	
	if( isSprintOverdue ){
		// sprint is overdue, disable to modify
		containerPanel.notifyBtnPermission( false, false, false, false );// add stage, add subStage, edit, delete
	}else{
		// set clicked panel to notify
		containerPanel.setClickedPanel( panel );
		
		// clicked panel is level 1
		if( panel.level == 1 ){
			containerPanel.notifyBtnPermission( true, true, true, true );
		}
		// clicked panel is level 2
		else if( panel.level == 2 ){
			containerPanel.notifyBtnPermission( true, false, true, true );
		}
	}

	// 取消選取其他 Panel
	for ( var i = headFixItemLength; i < containerPanel.items.length - tailFixItemLength; i++ )
    {
		// stage at level one
		var stage = containerPanel.items.get(i);
		stage.getEl().first().applyStyles('border-color: #99bbe8');
		stage.getEl().last().first().applyStyles('border-color: #99bbe8');

		var subStageAmount = stage.items.length;
		if(  subStageAmount != 0 ){
			for( var j = 0; j < subStageAmount; j++ ){
				// stage at level two
				var subStage = stage.items.get(j);
				subStage.getEl().first().applyStyles('border-color: #99bbe8');
				subStage.getEl().last().first().applyStyles('border-color: #99bbe8');
			}
		}
    }
	
	// 選取 Panel
	var header = panel.getEl().first();
	var bodyContent = panel.getEl().last().first();
	// 改變CSS
	header.applyStyles('border-color: red;');
	bodyContent.applyStyles('border-color: red;');
}

// 處理拖拉事件
function handlePanelDragDrop_TaskBoard( notifyPanel, ddLevel, oriID, tarID ){
	showMask_TaskBoardConfig();
	
	var sprintID = notifyPanel.getComboSprintID();
	
	Ext.Ajax.request({
		scope	: this,
		url		: 'plugin/taskBoard/config/manageStage/dragDropWorkStage',
		params  :{
			sprintID : sprintID,
			ddLevel : ddLevel,
			oriID : oriID,
			tarID : tarID
		},
		success : function(response) {
			Ext.example.msg('Move Stage', 'Move Stage Success.');
			notifyPanel.fireEvent('resetWorkStagesEvent', '');
		},
		failure : function() {
			Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
		},
		callback : function(){
			hideMask_TaskBoardConfig();
		}
	});
}