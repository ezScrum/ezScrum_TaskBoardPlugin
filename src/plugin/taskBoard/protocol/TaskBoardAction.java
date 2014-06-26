package plugin.taskBoard.protocol;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import javax.servlet.http.HttpSession;

import ntut.csie.ezScrum.pic.core.IUserSession;
import ntut.csie.ezScrum.web.form.ProjectInfoForm;
import ntut.csie.ezScrum.web.internal.IProjectSummaryEnum;
import ntut.csie.protocal.Action;

import org.kohsuke.stapler.StaplerRequest;
import org.kohsuke.stapler.StaplerResponse;

import plugin.taskBoard.DAO.IssueDAO;
import plugin.taskBoard.dataModel.IssueInformation;
import plugin.taskBoard.webservice.EzScrumWebServiceController;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class TaskBoardAction implements Action {

	private String mEzScrumURL;

	@Override
	public String getUrlName() {
		return "taskBoard";
	}

	public Object getDynamic(String token, StaplerRequest request, StaplerResponse response) {
		if (token.equals("config")) { //delegate to config
			return new ConfigAction();
		} else if (token.equals("ci")) { //delegate to ci
			return new CIAction();
		}

		return this;
	}

	// update issue status 
	//http://localhost:8080/ezScrum/taskBoard/updateIssueStatus
	public void doUpdateIssueStatus(StaplerRequest req, StaplerResponse rsp) {
		HttpSession session = req.getSession();
		ProjectInfoForm projectInfoForm = (ProjectInfoForm) session.getAttribute(IProjectSummaryEnum.PROJECT_INFO_FORM);

		String projectID = projectInfoForm.getName();
		String sprintID = req.getParameter("sprintID");
		String issueID = req.getParameter("issueID");
		String status = req.getParameter("status");
		//check null condition
		if (projectID == null || issueID == null || status == null ||
		        projectID.isEmpty() || issueID.isEmpty() || status.isEmpty()) {
			try {
				rsp.getWriter().write("projectID, issueID, status cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		IssueDAO issueDAO = new IssueDAO();
		IssueInformation issue = new IssueInformation(projectID, sprintID, issueID, status, "");
		issueDAO.updateIssueStatus(issue);
	}

	//get TaskBoard Story and Task by project id, sprint id and handler id 
	//http://localhost:8080/ezScrum/taskBoard/getTaskBoardStoryTaskList
	public void doGetTaskBoardStoryTaskList(StaplerRequest req, StaplerResponse rsp) {
		HttpSession session = req.getSession();
		mEzScrumURL = req.getServerName() + ":" + req.getLocalPort() + req.getContextPath();
		ProjectInfoForm projectInfoForm = (ProjectInfoForm) session.getAttribute(IProjectSummaryEnum.PROJECT_INFO_FORM);

		String projectID = projectInfoForm.getName();
		String sprintID = req.getParameter("sprintID");
		String handlerID = req.getParameter("handlerID");
		IUserSession userSession = (IUserSession) session.getAttribute("UserSession");
		String account = userSession.getAccount().getAccount();
		String password = (String) session.getAttribute("passwordForPlugin");
		//check null condition
		if (projectID == null || sprintID == null || handlerID == null ||
		        projectID.isEmpty() || sprintID.isEmpty() || handlerID.isEmpty()) {
			try {
				rsp.getWriter().write("projectID, sprintID, handlerID cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		String jsonString = "";
		EzScrumWebServiceController ezScrumWebServiceController = new EzScrumWebServiceController(mEzScrumURL);

		jsonString = ezScrumWebServiceController.getSprintBacklog(projectID, account, password, sprintID, handlerID);

		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject) parser.parse(jsonString);
		JsonArray stories = o.getAsJsonArray("Stories");

		ArrayList<TaskBoard_Story> storyList = new ArrayList<TaskBoard_Story>();

		IssueDAO issueDAO = new IssueDAO();

		for (JsonElement jsonElement : stories) {
			JsonObject jsonObject = jsonElement.getAsJsonObject();
			TaskBoard_Story story = new Gson().fromJson(jsonObject.toString(), TaskBoard_Story.class);

			List<TaskBoard_Task> taskList = story.Tasks;
			for (TaskBoard_Task task : taskList) {
				IssueInformation issue = new IssueInformation(projectID, story.Sprint, task.Id, task.Status, "");
				task.PluginStatus = issueDAO.getIssueStatus(issue);
			}
			story.Tasks = taskList;
			storyList.add(story);
		}

		HashMap<String, Object> jsonMap = new HashMap<String, Object>();
		jsonMap.put("success", "true");
		jsonMap.put("Total", storyList.size());
		jsonMap.put("Stories", storyList);
		jsonString = new Gson().toJson(jsonMap);

		try {
			rsp.setCharacterEncoding("utf-8");
			rsp.getWriter().write(jsonString);
			rsp.getWriter().close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	static class TaskBoard_Story {
		String Id;
		String Name;
		String Value;
		String Estimate;
		String Importance;
		String Tag;
		String Status;
		String Notes;
		String HowToDemo;
		String Link;
		String Release;
		String Sprint;
		String Attach;
		List<TaskBoard_AttachFile> AttachFileList;
		List<TaskBoard_Task> Tasks;
	}

	static class TaskBoard_Task {
		String Id;
		String Name;
		String Estimate;
		String RemainHours;
		String Handler;
		String Notes;
		List<TaskBoard_AttachFile> AttachFileList;
		String Attach;
		String Status;
		String PluginStatus;
		String Partners;
		String Link;
		String Actual;
	}

	static class TaskBoard_AttachFile {
		long FileId;
		String FileName;
		String FilePath;
		Date UploadDate;
	}
}
