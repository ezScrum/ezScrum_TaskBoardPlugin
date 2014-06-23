// inner plugin namespace : EzScrum.Plugin.... 
Ext.ns('EzScrum.Plugin.TaskBoard');

EzScrum.Plugin.TaskBoard.TaskboardCardHeaderPanel = Ext.extend(Ext.Panel, {
	autoHeight: true,
	title : 'Task Board Card',
	autoScroll : true,
	border :true,
	defaults : {
		bodyStyle : 'padding:5px;'
	},
	initComponent : function() {
		// param
		this.stageArray = this.value;

		// count Column number to set layout config
		this.stageColumnNumber = 0;
		for(var i = 0; i < this.stageArray.length; i++){
    		if(this.stageArray[i].subStage != undefined && this.stageArray[i].subStage != ""){
    			this.stageColumnNumber += this.stageArray[i].subStage.length;
    		}else{
    			this.stageColumnNumber += 1;
    		}
    	}

		this.stageFixedWidth = 300;
		this.stageFixedHeight = 40;
		
		var config = {
			layout : 'table',
			layoutConfig : {
				columns: this.stageColumnNumber,
				tableAttrs : {
					style : {
						width : this.stageColumnNumber * this.stageFixedWidth
					}
				}
			}
		};
		
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.TaskboardCardHeaderPanel.superclass.initComponent.apply(this, arguments);
		
	},
	init_StatusPanel: function() {
		this.removeAll();

		/* 
		 * 判斷中間狀態有無subStage來決定table layout的rowspan 以及 item 的 padding
		 * 如果 table layout 中，只有一層卻全部欄位都  rowspan : 2，會導致 StagePanel layout跑掉，抓不到card的高度
		 */
		var fixedFieldRowSpan = 1;
		var paddingSetting = 'padding:5px;';
		for(var i = 2; i < this.stageArray.length-1; i++){
			if(this.stageArray[i].subStage != undefined && this.stageArray[i].subStage != ""){
				fixedFieldRowSpan = 2;
				this.stageFixedHeight = 80; // 有subStage才把高度調高
				paddingSetting = 'padding:25px;'; // single layer padding
				break;
			}
		}
		
		var subStageArray = [];
		
		// add Middle Stage
		for(var i = 0; i < this.stageArray.length; i++){
			var cssName = 'TASKBOARD_CHECKOUT_HEADER';
			
			if(this.stageArray[i].subStage == undefined || this.stageArray[i].subStage ==""){
				// fixed stage: Story, Not Checked Out
				if( i < 2 ){
					cssName = 'TASKBOARD_NOT_CHECKOUT_HEADER';
				}// fixed stage: Done
				else if( i == this.stageArray.length-1){
					cssName = 'TASKBOARD_DONE_HEADER';
				}
				
				var wip = "";
				if( this.stageArray[i].wip != 0 && this.stageArray[i].wip != undefined){
					wip = "("+this.stageArray[i].wip+")";
				}
				
				this.add({ bodyStyle : paddingSetting, rowspan: fixedFieldRowSpan, baseCls : cssName, html : '<p><h1><font size="5">' + this.stageArray[i].name + wip +'</font></h1></p>', height: this.stageFixedHeight, width: this.stageFixedWidth});
				
			}else if(this.stageArray[i].subStage != undefined && this.stageArray[i].subStage != "" ){
				var subStageNumber = this.stageArray[i].subStage.length;
				
				this.add({ colspan:subStageNumber, baseCls : cssName, html : '<p><h1><font size="5">' + this.stageArray[i].name + '</font></h1></p>', height: this.stageFixedHeight/2, width: this.stageFixedWidth * subStageNumber});
				
				for(var j = 0; j < subStageNumber; j++){
					var wip = "";
					if( this.stageArray[i].subStage[j].wip != 0 && this.stageArray[i].subStage[j].wip != undefined){
						wip = "("+this.stageArray[i].subStage[j].wip+")";
					}
					
					subStageArray.push({ baseCls : cssName, html : '<p><h1><font size="5">' + this.stageArray[i].subStage[j].name + wip + '</font></h1></p>', height: this.stageFixedHeight/2, width: this.stageFixedWidth});
				}
			}
		}
		
		// add subStage
		this.add(subStageArray);

		this.doLayout();
	}
});
Ext.reg('TaskboardCardHeaderPanel_TaskBoard', EzScrum.Plugin.TaskBoard.TaskboardCardHeaderPanel);
