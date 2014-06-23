Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Window');

Ext.apply(Ext.form.VTypes, {
	CheckUploadFileName_TaskBoard : function(fileName, field) {
		if (fileName.search("#") != -1){	   // #
		}else if (fileName.search(/%/) != -1){ // %
		}else if (fileName.search(/&/) != -1){ // &
		}else if (fileName.search(/\+/) != -1){// +
		}else if (fileName.search(/\//) != -1){// /
		}else if (fileName.search(/\*/) != -1){// *
		}else if (fileName.search(/\?/) != -1){// ?
		}else if (fileName.search(/\"/) != -1){// "
		}else if (fileName.search(/</) != -1){ // <
		}else if (fileName.search(/>/) != -1){ // >
		}else if (fileName.search(/\|/) != -1){// |
		/*
		 * Chrome 上傳欄位顯示的 path 為 C:\fakepath\fileName，Firefox 則只有 fileName
		 * 因此 \,: 不可擋
		 */
//		}else if (fileName.search(/\\/) != -1){// \ 
//		}else if (fileName.search(/:/) != -1){ // : 
        }else{
        	return true;
        }
        return false;
    },
    checkUploadFileNameText : 'Special characters #,%,&,+,/,*,?,",<,>,| are not allowed.'
});

/* Attach File Form */
EzScrum.Plugin.TaskBoard.AttachFileForm = Ext.extend(Ext.form.FormPanel, {
	issueId:'-1',
	projectName:undefined,
	bodyStyle: 'padding:15px',
	border : false,
	defaultType: 'textfield',
	notifyPanel		: undefined,
	labelAlign : 'right',
	labelWidth : 100,
	defaults: {
        width: 500,
        msgTarget: 'side'
    },
    monitorValid:true,
	initComponent:function() {
		var config = {
			url : 'ajaxAttachFile.do',
			fileUpload : true,
			items: [{
					xtype:'fileuploadfield',
					emptyText: 'Select a file',
		            fieldLabel: 'Update File',
		            name: 'file',
		            vtype: 'CheckUploadFileName_TaskBoard',
		            allowBlank: false
			}],
		    buttons: 
		    [{
		    	formBind:true,
		    	id: 'SubmitBtn',
	    		text: 'Submit',
	    		scope:this,
	    		handler: this.submit,
	    		disabled:true
	    	},
	        {
	        	text: 'Cancel',
	        	scope:this,
	        	handler: function(){this.ownerCt.hide();}
	        }]
        }
        
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		
		EzScrum.Plugin.TaskBoard.AttachFileForm.superclass.initComponent.apply(this, arguments);
		
		this.addEvents('AttachSuccess', 'AttachFailure');
	},
	onRender:function() {
		EzScrum.Plugin.TaskBoard.AttachFileForm.superclass.onRender.apply(this, arguments);
		this.getForm().waitMsgTarget = this.getEl();
	},
	submit : function()
	{
		if(this.getForm().isValid()){
			var myMask = new Ext.LoadMask(this.getEl(), {msg:"Please wait..."});
			myMask.show();
			var obj = this;
			var readUrl = this.url + "?issueID=" + this.issueId;
			
			this.getForm().submit({
				url:readUrl,
				params: {projectName: obj.projectName,
						 entryPoint: obj.notifyPanel.entryPoint},
				success: function(form, action) {
			       obj.onSuccess(action);
			    },
			    failure:function(form, action){
			    	obj.onFailure(action);
			    }
			});
		}

	},
	onSuccess:function(response) 
	{
		var success = false;
		
		var myMask = new Ext.LoadMask(this.getEl(), {msg:"Please wait..."});
		myMask.hide();

		// because ViewReportIssues.jsp 讓外部使用者回報的頁面，不能擋權限，所以暫時先註解
//		ConfirmWidget.loadData(response);
//		if (ConfirmWidget.confirmAction()) {
		
		if(this.notifyPanel.entryPoint == "CustomIssue" ||
		   this.notifyPanel.entryPoint == "ReportIssues")
		{
			var rs = jsonCustomIssueReader.readRecords(response.result);
		}else{
			var rs = jsonStoryReader.readRecords(response.result);
		}
		success = rs.success;
		if(rs.success && rs.totalRecords > 0) {
			var record = rs.records[0];
			if(record) {
				this.notifyPanel.notify_AttachFile(success, record, null);
			}
		} else {
			this.onFailure(onFailure);
		}
//		}
	},
	onFailure:function(response) 
	{
		var myMask = new Ext.LoadMask(this.getEl(), {msg:"Please wait..."});
		myMask.hide();
		var msg = 'Attach File Failure';
		if(response.result && response.result.msg)
			msg = response.result.msg;
		this.notifyPanel.notify_AttachFile(false, record, msg);
		
	},
	reset:function(){
		this.getForm().reset();
	}
});

Ext.reg('AttachFileForm_TaskBoard', EzScrum.Plugin.TaskBoard.AttachFileForm);

EzScrum.Plugin.TaskBoard.Window.AttachFileWindow = Ext.extend(Ext.Window, {
	title:'Attach File',
	width:700,
	modal:true,
	closeAction:'hide',
	constrain : true,
	initComponent:function() {
		var config = {
			layout:'form',
			items : [{xtype:'AttachFileForm_TaskBoard'}]
        }
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Window.AttachFileWindow.superclass.initComponent.apply(this, arguments);
		
		this.attachForm = this.items.get(0); 
	},
	attachFile:function(panel, id){
		this.attachForm.reset();
		this.attachForm.issueId = id;
		// initial form info
        this.attachForm.notifyPanel = panel;
        // initial window info 
        this.setTitle('Attach File');
		this.show();
	},
	attachFile_External:function(panel, id, projectName){
		this.attachForm.reset();
		this.attachForm.issueId = id; 
		this.attachForm.projectName = projectName;
		// initial form info
        this.attachForm.notifyPanel = panel;
		// initial window info 
        this.setTitle('Attach File'); 
        this.show();
	}
});