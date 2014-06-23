Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Window');
Ext.ns('EzScrum.Plugin.TaskBoard.Layout');

EzScrum.Plugin.TaskBoard.EditStoryForm = Ext.extend(Ext.form.FormPanel, {
	addurl   	  : 'ajaxAddNewStory.do',	// for add story action
	editurl		  : 'ajaxEditStory.do',		// for edit story action
	loadUrl		  : 'getEditStoryInfo.do',	// for load story action
	CurrentIssueID: '-1',
	EditRecord	  : undefined,		// edit record
	notifyPanel	  : undefined,		// notify panel
    frame         : false,
    autoScroll	  : true,
    bodyStyle     : 'padding:15px',
    border        : false,
    defaultType   : 'textfield',
    labelAlign    : 'right',
    labelWidth    : 100,
    monitorValid  : true,
    defaults      : {
        width     : 500,
        msgTarget : 'side'
    },
    initComponent : function() {
        var config = {
            items   : [{
	            fieldLabel	: 'ID',
	            name		: 'issueID',
				readOnly	: true,
				ref			: 'Project_ProductBacklog_Story_refID',
				emptyText	: ''
	        }, {
                fieldLabel : 'Name',
                name       : 'Name',
                allowBlank : false,
                maxLength  : 128
            }, {
                fieldLabel : 'Value',
                name       : 'Value',
                vtype      : 'Number'
            }, {
                fieldLabel : 'Estimation',
                name       : 'Estimation',
                vtype      : 'Float'
            }, {
                fieldLabel : 'Importance',
                name       : 'Importance',
                vtype      : 'Number'
            }, {
                fieldLabel : 'Notes',
                xtype      : 'textarea',
                name       : 'Notes',
                height     : 150
            }, 
            EzScrum.Plugin.TaskBoard.TagTriggerField,
            EzScrum.Plugin.TaskBoard.TagIDTextField, {
                fieldLabel : 'How To Demo',
                xtype      : 'textarea',
                name       : 'HowToDemo',
                height     : 150
            }, {
                name   : 'sprintId',
                hidden : true
            }],
            buttons : [{
                formBind : true,
                text     : 'Submit',
                scope    : this,
                disabled : true,
                handler  : function() {
            		this.EditSubmit();
                }
            }, {
                text    : 'Cancel',
                scope   : this,
                handler : function() { this.ownerCt.hide(); }
            }]
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config));
        EzScrum.Plugin.TaskBoard.EditStoryForm.superclass.initComponent.apply(this, arguments);
    },
    EditSubmit		: function() {
    	var obj = this;
    	var form = this.getForm();
    	// update tag info
    	EzScrum.Plugin.TaskBoard.IssueTagMenu.items.each(function(){
			obj.UpdateStoryTag(this.tagId, this.text, this.checked);
		});
    	
    	Ext.Ajax.request({
			url		: obj.editurl,
			params  : form.getValues(),
			success	: function(response){ obj.onEditSuccess(response); },
            failure : function(response) { /* notify logon form, not finish yet */ }
		});
    },
    onSuccess		: function(response) {
    	var success = false;
    	var record = undefined;
    	
        ConfirmWidget.loadData(response);
        if (ConfirmWidget.confirmAction()) {
            var rs = jsonStoryReader.read(response);
            success = rs.success;
            if (rs.success) {
                record = rs.records[0];
            }
        }
        
        this.notifyPanel.notify_CreateStory(success, response, record);
    },
    onEditSuccess	: function(response) {
    	var success = false;
    	var record = undefined;
    	
    	ConfirmWidget.loadData(response);
		if (ConfirmWidget.confirmAction()) {
			var rs = jsonStoryReader.read(response);
			success = rs.success;
            if (rs.success) {
                record = rs.records[0];
            }
		}
		
		this.notifyPanel.notify_EditStory(success, response, record);
    },
    loadDataModel	: function() {
    	var obj = this;
        var form = this.getForm();
        
    	Ext.Ajax.request({
			url		: obj.loadUrl,
			params	: { issueID : this.CurrentIssueID },
			success	: function(response) { obj.onLoadSuccess(response); },
			failure : function(response) { /* notify logon form, not finish yet */ }
		});
    },
    onLoadSuccess : function(response) {
    	var success = false;
    	var record = undefined;
    	
    	ConfirmWidget.loadData(response);
		if (ConfirmWidget.confirmAction()) {
			var rs = myReader.readRecords(response.responseXML);
			success = rs.success;
			if (rs.success) {
				record = rs.records[0];
				if (record) {
					this.EditRecord = record;
					
					// set initial tag value
					EzScrum.Plugin.TaskBoard.IssueTagMenu.setInitTagInfo(record);
					
					var replaced_Name = replaceJsonSpecialChar(record.data['Name']);
					var replaced_Notes = replaceJsonSpecialChar(record.data['Notes']);
					var replaced_HowToDemo = replaceJsonSpecialChar(record.data['HowToDemo']);
					
					// set initial from value
					this.getForm().setValues({
						issueID			: record.data['Id'], 
						Name			: replaced_Name,
						Value			: record.data['Value'], 
						Importance		: record.data['Importance'], 
						Estimation		: record.data['Estimation'], 
						Notes			: replaced_Notes, 
						HowToDemo		: replaced_HowToDemo
					});
				}
			}
		}
    },
    UpdateStoryTag : function(tagId, text, checked) {
		var recordTags = this.EditRecord.data['Tag'].split(',');
		var storyid = this.EditRecord.data['Id'];
		var tagExist = false;
		
		for (var i = 0; i < recordTags.length; i++) {
			if (text == recordTags[i]) {
				tagExist = true;
				i = recordTags.length;
			}
		}
		
		if(tagExist == true && checked == true){}
		else if(tagExist == true && checked == false){
			Ext.Ajax.request({
				url : 'AjaxRemoveStoryTag.do',
				success : function(response){},
				params : {storyId: storyid, tagId: tagId}
			});
		}
		else if(tagExist == false && checked == true){
			Ext.Ajax.request({
				url : 'AjaxAddStoryTag.do',
				success : function(response){},
				params : {storyId: storyid, tagId: tagId}
			});
		}
		else if(tagExist == false && checked == false){}
    },
    reset : function() {
        this.getForm().reset();
        this.isCreate = true;	// default
        EzScrum.Plugin.TaskBoard.IssueTagStore.reload();
    },
    initialAddForm : function() {
    	this.reset();  	
    	this.Project_ProductBacklog_Story_refID.disable();
    },
    initialEditForm : function() {
    	this.reset();
    	this.Project_ProductBacklog_Story_refID.enable();
    }
});

Ext.reg('EditStoryForm_TaskBoard', EzScrum.Plugin.TaskBoard.EditStoryForm);

EzScrum.Plugin.TaskBoard.Window.EditStoryWindow = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.Window, {
    title       : ' ',
    bodyStyle	: 'padding: 5px',
    initComponent : function() {
        var config = {
            layout : 'form',
            items  : [{ xtype : 'EditStoryForm_TaskBoard' }]
        }
        
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        EzScrum.Plugin.TaskBoard.Window.EditStoryWindow.superclass.initComponent.apply(this, arguments);

        this.StoryForm = this.items.get(0);
    },
    showTheWindow_Edit: function(panel, issuueID) {
    	// initial form info
    	this.StoryForm.initialEditForm();
    	this.StoryForm.CurrentIssueID = issuueID;
    	this.StoryForm.notifyPanel = panel;
    	this.StoryForm.isCreate = false;
    	this.StoryForm.loadDataModel();

        // initial window info
    	this.setTitle('Edit Story');
    	this.show();
    }
});