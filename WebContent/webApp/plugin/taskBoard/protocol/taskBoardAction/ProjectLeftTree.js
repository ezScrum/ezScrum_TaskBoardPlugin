Ext.ns('Plugin.TaskBoard.projectLeftTree');

Plugin.TaskBoard.projectLeftTree.TreePlugin = Ext.extend(Object, {
	init: function(cmp) {
		this.hostCmp = cmp;
		this.hostCmp.on('render', this.onRender, this, {delay: 200});
	},

	onRender: function() {
		var childNode = {
				id:'taskBoardCofig',
				text : '<u>Task Board Config</u>',
				cls:'treepanel-leaf',
	        	iconCls:'leaf-icon',
				leaf:true,
				listeners: {
					click: function(node, event) {
						var index = Ext.getCmp('content_panel').items.keys.indexOf("PluginConfigPage");
						Ext.getCmp('content_panel').layout.setActiveItem(index);
						Ext.getCmp('left_panel').Plugin_Clicked = true;
					}
				}
			};
			var nodes = this.hostCmp.getRootNode().childNodes;
			var node;
			nodes.forEach(function(parentNode) {
				if (parentNode.id == "pluginConfiguration") {
					node = parentNode;
					node.appendChild(childNode);
				}
			});
			if (node == null) {
				node = new Ext.tree.AsyncTreeNode({
					text: 'Plugin Configuration',
			    	id 	: 'pluginConfiguration',
					expanded : true,
					iconCls:'None',
		        	cls:'treepanel-parent',
					children : [childNode]
				});
			}
			this.hostCmp.getRootNode().appendChild(node);
			this.hostCmp.doLayout();
	}
});

Ext.preg('taskBoard_TreeNode', Plugin.TaskBoard.projectLeftTree.TreePlugin);
