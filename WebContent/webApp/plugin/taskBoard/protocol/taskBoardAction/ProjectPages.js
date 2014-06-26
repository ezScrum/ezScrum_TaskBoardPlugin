Ext.ns('Plugin.TaskBoard');

var formPanelID;

var taskBoardPluginSaveBtnHandler = function(btn) {
	function showResult(btn,text){
	    if (btn == 'yes') {
	    	var formPanel = Ext.getCmp(formPanelID);
	    	var fieldArray = formPanel.getForm().getValues();
	    	var available;
  	  		if (fieldArray['availableCheckbox'] == 'on'){
  	  			available = 'true';
  	  		} else {
  	  			available = 'false';
  	  		}
	    	Ext.Ajax.request({
	      	    loadMask: true,
	      	    url: 'project/setProjectPluginConfig',
	      	    params: {
	      	    	pluginName : formPanel.id,
	      	    	available : available
	      	    },
	      	    success: function(resp) {
	      	    	var projectName = resp.responseText;
	      	    	location.replace("./viewProject.do?PID=" + projectName );
	      	   } 
	      	});
	    }
	};
    Ext.MessageBox.confirm('Confirm', 'Your change will be applied in TaskBoard.', showResult );
}


var taskBoardPluginSaveBtn = new Ext.Button({
    text    : 'Save',
    handler : taskBoardPluginSaveBtnHandler
});

Plugin.TaskBoard.PluginConfigPage = Ext.extend(Ext.Panel, {
	init: function(cmp) {
		this.hostCmp = cmp;
		this.hostCmp.on('render', this.onRender, this, {delay: 200});
	},

	onRender: function() {
		panel = new Ext.Panel({
			id			: 'PluginConfigPage',
			layout		: 'anchor',
			autoScroll	: true,
			_pluginConfigArray: '',
			initComponent : function(){
				Ext.apply(this, Ext.apply(this.initialConfig));
				Plugin.TaskBoard.PluginConfigPage.superclass.initComponent.apply(this, arguments);
			}, listeners : {
			      'beforerender' : function() {
			    	  var obj = this;
			  	      Ext.Ajax.request({
			  	    	    loadMask: true,
			  	    	    url: 'getConfigPluginList',
			  	    	    result: '',
			  	    	    success: function(resp) {
			  	    	    	// resp is the XmlHttpRequest object
			  	    	    	result = Ext.decode(resp.responseText);

			  	    	   },
			  	    	   callback: function(opt,success,resp) {
			  	    	    	for (var i in result.data.plugin) {
			  	    	    		if (result.data.plugin[i].name != "" ){
			  	    	    			if (result.data.plugin[i].name != "TaskBoardPlugin") {
			  	    	    				continue;
			  	    	    			}
			  	    	    			formPanelID = result.data.plugin[i].name;
			  	    	    			var formPanel = new Ext.form.FormPanel({  
			  	    	    				id: result.data.plugin[i].name,
			  	    	    				title:result.data.plugin[i].name,
			  	    	    				items:[{
			  	    			            	xtype: "fieldset",  
			  	    			            	checkboxToggle: true,  
			  	    			            	checkboxName: "availableCheckbox", 
			  	    			            	collapsed: true,
			  	    			            	title: "available",  
			  	    			            	defaultType: 'textfield',  
			  	    			            	autoWidth: true,  
			  	    			            	autoHeight: true,
			  	    			            	plugins:[result.data.plugin[i].name]
			  	    			            }]
			  	    	    			});
			  	    	    			
			  	    	    			obj.on({
			  	    	    				'show':function(){
			  	    	    					formPanel.items.get(0).plugins[0].fireEvent('show');//fire event to plugin
			  	    	    				}
			  	    	    			});
			  	    	    			obj.add( formPanel );

			  	    	    		}
			  	    	    	}
			  	    	       obj.add(taskBoardPluginSaveBtn);
			  	    	   } 
			  	    	});
			  	        
			  	   },
				   'show':function(){
					   this.setData();
				   
				   },
				   'add':function(){
					   this.setData();
				   }
			  },setData : function( event ) {
				  var obj = this;
		 			Ext.Ajax.request({
						loadMask: true,
						url: 'project/getProjectPluginConfig',
						success: function(resp) {
							// resp is the XmlHttpRequest object
							var result = Ext.decode(resp.responseText);
							_pluginConfigArray = result.data.pluginConfigArray;
							for( var i in _pluginConfigArray ){
								var pluginConfig = _pluginConfigArray[i];
								var form;
								for( var key in pluginConfig ){
									if( key == 'id' ){
										if (Ext.getCmp( pluginConfig.id ))
											form = Ext.getCmp( pluginConfig.id ).getForm();
									}else if( key == 'available'){
										if( pluginConfig[key] == true ){
											if (Ext.getCmp( pluginConfig.id )){
												if (Ext.getCmp( pluginConfig.id ).items.get(0)) {
													if( Ext.getCmp( pluginConfig.id ).items.get(0).checkbox ){
												        Ext.getCmp( pluginConfig.id ).items.get(0).expand();
													}
												}
											}
										}
									}
								}
							}	
						} 
					});
			  }
			  });

		this.hostCmp.add(panel);
		this.hostCmp.doLayout();
	}
});

Ext.preg('taskBoard_ConfigPage', Plugin.TaskBoard.PluginConfigPage);
