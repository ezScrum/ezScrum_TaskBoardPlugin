package plugin.taskBoard.protocol;

import java.util.List;

import ntut.csie.ui.protocol.EzScrumUI;
import ntut.csie.ui.protocol.PluginUI;
import ntut.csie.ui.protocol.TaskBoardUI;
import ntut.csie.ui.protocol.UIConfig;

public class PluginImp extends UIConfig{

	@Override
	public void setEzScrumUIList(List<EzScrumUI> ezScrumUIList) {
		final PluginUI pluginUI = new PluginUI(){
			public String getPluginID(){
				return "boardConfigPlugin";
			}
					
		};
		
		ezScrumUIList.add( pluginUI );
		
		 
		TaskBoardUI taskBoardUI = new TaskBoardUI(){

			@Override
			public PluginUI getPluginUI() {
				// TODO Auto-generated method stub
				return pluginUI;
			}

			@Override
			public String getBaordPlugin() {
				// TODO Auto-generated method stub
				return "TaskBoardPlugin";
			}
			
		};
		
		ezScrumUIList.add( taskBoardUI );
	}

}
