package plugin.taskBoard.protocol;

import java.util.ArrayList;
import java.util.List;

import ntut.csie.ui.protocol.EzScrumUI;
import ntut.csie.ui.protocol.PluginUI;
import ntut.csie.ui.protocol.ProjectUI;
import ntut.csie.ui.protocol.TaskBoardUI;
import ntut.csie.ui.protocol.UIConfig;

public class PluginImp extends UIConfig {

	@Override
	public void setEzScrumUIList(List<EzScrumUI> ezScrumUIList) {
		final PluginUI pluginUI = new PluginUI() {
			public String getPluginID() {
				return "TaskBoardPlugin";
			}

		};

		ezScrumUIList.add(pluginUI);

		TaskBoardUI taskBoardUI = new TaskBoardUI() {

			@Override
			public PluginUI getPluginUI() {
				return pluginUI;
			}

			@Override
			public String getBaordPlugin() {
				return "boardPlugin";
			}

		};

		ezScrumUIList.add(taskBoardUI);
		
		/**
		 * add ReleasePlanUI to ezScrumUIList for ReleasePlan Pages view
		 */
		ProjectUI projectUI = new ProjectUI() {
			// 定義要放在左方Tree的node
			@Override
			public List<String> getProjectLeftTreeIDList() {
				List<String> projectLeftTreeIDList = new ArrayList<String>();
				projectLeftTreeIDList.add("taskBoard_TreeNode");
				return projectLeftTreeIDList;
			}

			// 定義要左方Tree的node要連結到的頁面
			@Override
            public List<String> getProjectPageIDList() {
				List<String> projectPageIDList = new ArrayList<String>();
				projectPageIDList.add("taskBoard_ConfigPage");
				return projectPageIDList;
            }

			@Override
			public PluginUI getPluginUI() {
				return pluginUI;
			}
		};
		ezScrumUIList.add(projectUI);
	}

}
