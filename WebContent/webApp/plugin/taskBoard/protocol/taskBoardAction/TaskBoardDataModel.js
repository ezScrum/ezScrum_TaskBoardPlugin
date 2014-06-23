// ezScrum inner plugin namespace : EzScrum.Plugin.... 
Ext.ns('EzScrum.Plugin.TaskBoard');

/*
 * Story
 */
// Story Record 
EzScrum.Plugin.TaskBoard.StoryRecord = Ext.data.Record.create([ {
	name : 'Id',
	sortType : 'asInt'
	}, 'Name', {
	name : 'Value',
	sortType : 'asInt'
	}, {
	name : 'Importance',
	sortType : 'asInt'
	}, {
	name : 'Estimate',
	sortType : 'asFloat'
	}, 'Status', 'Notes', 'HowToDemo', {
	name : 'Release',
	sortType : 'asInt'
	}, {
	name : 'Sprint',
	sortType : 'asInt'
	}, 'Tag', 'Link', 'Attach', 'AttachFileList', 'Tasks' ]
);

//Story Reader
EzScrum.Plugin.TaskBoard.StoryReader = new Ext.data.JsonReader({
	root : 'Stories',
	idProperty : 'Id',
	Id : 'Id',
	totalProperty : 'Total'
}, EzScrum.Plugin.TaskBoard.StoryRecord);


EzScrum.Plugin.TaskBoard.StoryStore = new Ext.data.Store({
	reader : EzScrum.Plugin.TaskBoard.StoryReader
});

/*
 * Task 
 */
// Task Record
EzScrum.Plugin.TaskBoard.TaskRecord = Ext.data.Record.create([
	{name:'Id', sortType:'asInt'},
	'Link',
	'Name',
	'Status',
	{name:'Estimation', sortType:'asFloat'},
	'Actual',
	'Handler',
	'Partners',
	'Notes',
	'Actors',
	'Remains'
]);

// Task XML Parser 
EzScrum.Plugin.TaskBoard.TaskXMLReader = new Ext.data.XmlReader({
   record: 'Task',
   idPath : 'Id'
}, EzScrum.Plugin.TaskBoard.TaskRecord);

// Task Jason Parser
EzScrum.Plugin.TaskBoard.TaskJsonReader = new Ext.data.JsonReader({
   root: 'Task',
   id : 'Id',
   totalProperty: 'Total'
}, EzScrum.Plugin.TaskBoard.TaskRecord);

// Issue Jason Parser, include Story and Task 
EzScrum.Plugin.TaskBoard.IssueJsonReader = new Ext.data.JsonReader({
   root: 'Issue',
   id : 'Id'
}, EzScrum.Plugin.TaskBoard.TaskRecord);

// Task Store
EzScrum.Plugin.TaskBoard.TaskStore = new Ext.data.Store({
	fields	:[
		{name : 'Id'},
		{name : 'Name'},
		{name : 'Notes'},
		{name : 'Handler'},
		{name : 'Partners'}
		],
	reader	: EzScrum.Plugin.TaskBoard.TaskJsonReader
});

/*
 * Handler
 */
// Handler Record
EzScrum.Plugin.TaskBoard.HandlerRecord = Ext.data.Record.create([ 'Name' ]);

// Handler Reader
EzScrum.Plugin.TaskBoard.HandlerReader = new Ext.data.XmlReader({
	record : 'Handler',
	idPath : 'Name',
	successProperty : 'Result'
}, EzScrum.Plugin.TaskBoard.HandlerRecord);

// Handler Store
EzScrum.Plugin.TaskBoard.HandlerComboStore = new Ext.data.Store({
	fields : [{
		name : 'Name'
	}],
	reader : EzScrum.Plugin.TaskBoard.HandlerReader
});

/*
 * Partner
 */
// Partner Reader
EzScrum.Plugin.TaskBoard.PartnerReader = new Ext.data.XmlReader({
	record : 'Partner',
	idPath : 'Name',
	successProperty : 'Result'	
}, EzScrum.Plugin.TaskBoard.HandlerRecord);

// Partner Store
EzScrum.Plugin.TaskBoard.PartnerStore = new Ext.data.Store({
	fields: [{name: 'Name'}],
	reader : EzScrum.Plugin.TaskBoard.PartnerReader//,
});

/*
 * Issue History
 */

// Issue History Record
EzScrum.Plugin.TaskBoard.IssueHistoryRecord = Ext.data.Record.create([
	'Id', 'Link', 'Name', 'IssueType'
]);
	
// Issue History Reader
EzScrum.Plugin.TaskBoard.IssueHistoryReader = new Ext.data.JsonReader({
	id: "Id"
}, EzScrum.Plugin.TaskBoard.IssueHistoryRecord);

// Issue History Store
EzScrum.Plugin.TaskBoard.IssueHistoryStore = new Ext.data.Store({
	fields : [
		{name : 'Id'},
		{name : 'Link'},
		{name : 'Name'},
		{name : 'IssueType'}
	],
	reader : EzScrum.Plugin.TaskBoard.IssueHistoryReader
});

// Issue History List Record
EzScrum.Plugin.TaskBoard.IssueHistoryListRecord = Ext.data.Record.create([
	'IssueHistories', 'Description', 'HistoryType', 'ModifiedDate'
]);

// Issue History List Reader
EzScrum.Plugin.TaskBoard.IssueHistoryListReader = new Ext.data.JsonReader({
   	id: "Id",
   	root: "IssueHistories"
}, EzScrum.Plugin.TaskBoard.IssueHistoryListRecord);

// Issue History List Store
EzScrum.Plugin.TaskBoard.IssueHistoryListStore = new Ext.data.Store({
	fields : [
		{name : 'Description'},
		{name : 'HistoryType'},
		{name : 'ModifiedDate'}
	],
	reader : EzScrum.Plugin.TaskBoard.IssueHistoryListReader
});

// Issue History List Column Model
EzScrum.Plugin.TaskBoard.IssueHistoryListColumnModel = new Ext.grid.ColumnModel({
	columns: [
		{dataIndex: 'ModifiedDate',header: 'Modified Date', width: 100},		          
		{dataIndex: 'HistoryType',header: 'History Type', width: 70},
		{dataIndex: 'Description',header: 'Description', width: 300}
	]
});

/*
 * Issue Tag
 * 若 issue tag 在TaskBoard有多處使用時, 請考慮refactory成xtype, 類似 partner widget
 * 或複製所有元件, 並以不同名稱區分
 */
// Issue Tag Record
EzScrum.Plugin.TaskBoard.IssueTagRecord = Ext.data.Record.create([ 
   {name:'Id', sortType:'asInt'}, 'Name' ]
);

// Issue Tag Reader
EzScrum.Plugin.TaskBoard.IssueTagReader = new Ext.data.XmlReader({
   record: 'IssueTag',
   idPath : 'Id',
   successProperty: 'Result'
}, EzScrum.Plugin.TaskBoard.IssueTagRecord);

// Issue Tag Store
EzScrum.Plugin.TaskBoard.IssueTagStore = new Ext.data.Store({
    fields : [{
    	name : 'Id',
        type : 'int'
    }, {
        name : 'Name'
    }],
    url      : 'AjaxGetTagList.do',
    reader   : EzScrum.Plugin.TaskBoard.IssueTagReader,
    autoLoad : true
});

// Issue Tag Store load event
EzScrum.Plugin.TaskBoard.IssueTagStore.on('load', function(store, records, options) {
	EzScrum.Plugin.TaskBoard.IssueTagMenu.removeAll();
	var tagCount = store.getTotalCount();
	for (var i=0 ; i<tagCount ; i++) {
		var tagRecord = store.getAt(i);
		EzScrum.Plugin.TaskBoard.IssueTagMenu.add({
			tagId        : tagRecord.data['Id'],
			text         : tagRecord.data['Name'],
			xtype        : 'menucheckitem',
			hideOnClick  : false,
			checkHandler : EzScrum.Plugin.TaskBoard.IssueTagMenu.onCheckItemClick
		});
	}
});

// Tag Trigger Field
EzScrum.Plugin.TaskBoard.TagTriggerField = new Ext.form.TriggerField({
    fieldLabel : 'Tags',
    name       : 'Tags',
    editable   : false
});

// Tag Trigger Field click event 
EzScrum.Plugin.TaskBoard.TagTriggerField.onTriggerClick = function() {
	var position = EzScrum.Plugin.TaskBoard.TagTriggerField.getPosition();
	EzScrum.Plugin.TaskBoard.IssueTagMenu.showAt(position);
};

// Tag Text Field
EzScrum.Plugin.TaskBoard.TagIDTextField = new Ext.form.TextField({
    xtype  : 'textarea',
    name   : 'TagIDs',
    hidden : true
});

// Issue Tag Menu
EzScrum.Plugin.TaskBoard.IssueTagMenu = new Ext.menu.Menu({
	onCheckItemClick : function(item, checked) {
        var tagRaw = EzScrum.Plugin.TaskBoard.TagTriggerField.getValue();
        var tagIDRaw = EzScrum.Plugin.TaskBoard.TagIDTextField.getValue();
        if (tagRaw.length != 0) {
            tags = tagRaw.split(",");
            tagIDs = tagIDRaw.split(",");
        } else {
            tags = [];
            tagIDs = [];
        }
        
        if (checked) {
            tags.push(item.text);
            tagIDs.push(item.tagId);
		} else {
			var index = tags.indexOf(item.text);
			tags.splice(index, 1);
			tagIDs.splice(index, 1);
		}
        
        EzScrum.Plugin.TaskBoard.TagTriggerField.setValue(tags.join(","));
        EzScrum.Plugin.TaskBoard.TagIDTextField.setValue(tagIDs.join(","));
    },
    setInitTagInfo: function(record) {
    	// reload store data
//    	EzScrum.Plugin.TaskBoard.IssueTagStore.reload();		// reload 會導致下面執行的勾勾不見，但是應該要有地方作 reload
    	
    	if ( record !== undefined) {
			var tags = record.data['Tag'].split(',');
			this.items.each(function() {
				for(var i=0 ; i<tags.length; i++) {
					if (this.text == tags[i]) {
						this.setChecked(true);
					}
				}
			});
		}
    }
});
