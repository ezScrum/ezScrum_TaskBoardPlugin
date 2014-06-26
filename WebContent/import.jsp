<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Insert title here</title>
<%@ page import="ntut.csie.ezScrum.plugin.PluginExtensioner" %>
</head>
<body>
<% PluginExtensioner pluginExtensioner = new PluginExtensioner("TaskBoardPlugin"); %>

<!-- javascript has only one way(request to action) to talk with action -->
<!-- jsp has ability to talk with java with jstl,etc... -->

<!-- Task Board Config Plug-in -->
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/configAction/widget/AddEditStageWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/configAction/widget/DeleteStageWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/configAction/widget/PanelFieldDragDropPlugin.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/configAction/widgetManager.js"></script>

<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/configAction/ManageWorkStagePanel.js"></script>

<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/configAction/config.js"></script>
<!-- Task Board Config Plug-in  End-->


<!-- Task Board Plug-in -->
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/ProjectLeftTree.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/ProjectPages.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/TaskBoardDataModel.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/layoutSupport/TaskBoardLayoutSupport.js"></script>

<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/HandlerComboWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/PartnerWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/EditTaskWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/EditStoryWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/AttachFileWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/IssueHistoryWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/CheckOutTaskWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/DoneIssueWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/ReCheckOutTaskWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/ReOpenIssueWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widget/HealthReportWidget.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/widgetManager.js"></script>

<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/StoryCard.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/TaskCard.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/TaskBoardStagePanel.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/TaskBoardCardHeaderPanel.js"></script>
<script type="text/javascript" src="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/taskBoardAction/TaskBoardCardPanel.js"></script>

<link rel="stylesheet" type="text/css" href="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/css/TaskBoard.css" />
<link rel="stylesheet" type="text/css" href="<%=pluginExtensioner.getWebPluginRoot() %>webApp/plugin/taskBoard/protocol/css/IssueHistory.css" />
<!-- Task Board Inner Plug-in   End-->


</body>
</html>