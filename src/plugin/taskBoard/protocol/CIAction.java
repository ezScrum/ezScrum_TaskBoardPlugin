package plugin.taskBoard.protocol;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpSession;

import ntut.csie.ezScrum.web.form.ProjectInfoForm;
import ntut.csie.ezScrum.web.internal.IProjectSummaryEnum;

import org.kohsuke.stapler.StaplerRequest;
import org.kohsuke.stapler.StaplerResponse;

import plugin.taskBoard.DAO.IssueDAO;
import plugin.taskBoard.DAO.PluginConfigDAO;
import plugin.taskBoard.dataModel.IssueInformation;
import plugin.taskBoard.webservice.EzScrumWebServiceController;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/*
 * Commit log 須遵照以下格式 1. key 要注意大小寫, 冒號後須空一格 IssueID: 5465 Design: http://123@123.cc.png Develop: add 5 files, modified 4 files Test: 20 tests passed Review: reviewed by ninja
 */

public class CIAction extends TaskBoardAction {

	private String mEzScrumURL;

	// http://localhost:8080/ezScrum/taskBoard/ci/getIssueHealthReport
	public void doGetIssueHealthReport(StaplerRequest req, StaplerResponse rsp) {
		HttpSession session = req.getSession();
		ProjectInfoForm projectInfoForm = (ProjectInfoForm) session.getAttribute(IProjectSummaryEnum.PROJECT_INFO_FORM);

		String projectID = projectInfoForm.getName();
		String sprintID = req.getParameter("sprintID");
		String issueID = req.getParameter("issueID");

		//check null condition
		if (projectID == null || sprintID == null || issueID == null || projectID.isEmpty() || sprintID.isEmpty() || issueID.isEmpty()) {
			try {
				rsp.getWriter().write("projectID, issueID cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		String feedbacks = getIssueHealthReport(projectID, sprintID, issueID);

		try {
			rsp.getWriter().write(feedbacks);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}

	private String getIssueHealthReport(String projectID, String sprintID, String issueID) {
		IssueDAO issueDAO = new IssueDAO();

		String feedbacks = issueDAO.getIssueHealthReport(projectID, sprintID, issueID);

		// get work stages
		PluginConfigDAO pluginConfigDAO = new PluginConfigDAO();
		String workStages = pluginConfigDAO.getWorkStages(projectID, sprintID);

		// if feedbacks is null, init it
		if (feedbacks == null || feedbacks.equals("")) {
			feedbacks = initFeedbackJsonData(workStages);
			// insert health report
			IssueInformation issue = new IssueInformation(projectID, sprintID, issueID, "", feedbacks);
			issueDAO.insertIssueInformation(issue);
		} else {
			// check each stage feedback field exists or not, if not, setup it
			feedbacks = checkEachStageFeedback(workStages, feedbacks);
			// update health report
			IssueInformation issue = new IssueInformation(projectID, sprintID, issueID, "", feedbacks);
			issueDAO.updateIssueHealthReport(issue);
		}

		return feedbacks;
	}

	// 如果 DB 沒 health report的資料, 則回傳包含各個stage name, 但內容為空的 feedback
	private String initFeedbackJsonData(String workStages) {
		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject) parser.parse(workStages);
		JsonArray stageArray = o.getAsJsonArray("stages");

		JsonObject healthReport = new JsonObject();
		JsonArray feedbackArray = new JsonArray();

		for (JsonElement e : stageArray) {
			JsonObject stage = e.getAsJsonObject();
			String stageName = stage.get("name").getAsString();
			if (stageName.equals("Story") || stageName.equals("Not Checked Out") || stageName.equals("Done")) {
				continue;
			}

			JsonObject feedback = new JsonObject();
			feedback.addProperty("name", stageName);
			feedback.addProperty("description", "");
			feedbackArray.add(feedback);
		}
		healthReport.add("feedbacks", feedbackArray);
		return healthReport.toString();
	}

	// 確認 issue 的 health report中, 是否有每個 stage 的記錄, 至少要是空的, 沒有的話幫忙建一個空的
	private String checkEachStageFeedback(String workStages, String feedbacks) {
		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject) parser.parse(workStages);
		JsonArray stageArray = o.getAsJsonArray("stages");

		JsonObject f = (JsonObject) parser.parse(feedbacks);
		JsonArray feedbackArray = f.getAsJsonArray("feedbacks");

		JsonObject healthReport = new JsonObject();

		// ci 的 feedback 欄位
		feedbackArray = checkFeedbackExist("buildResult", feedbackArray);
		feedbackArray = checkFeedbackExist("ciBuildURL", feedbackArray);

		// stage 的 feedback 欄位
		for (JsonElement e : stageArray) {
			JsonObject stage = e.getAsJsonObject();
			String stageName = stage.get("name").getAsString();

			if (stageName.equals("Story") || stageName.equals("Not Checked Out") || stageName.equals("Done")) {
				continue;
			}
			feedbackArray = checkFeedbackExist(stageName, feedbackArray);
		}

		healthReport.add("feedbacks", feedbackArray);
		return healthReport.toString();
	}

	private JsonArray checkFeedbackExist(String stageName, JsonArray feedbackArray) {
		JsonArray newFeedbackArray = new JsonArray();

		int index = 0;
		boolean isFound = false;
		for (JsonElement el : feedbackArray) {
			index++;
			JsonObject feedback = el.getAsJsonObject();
			String feedbackName = feedback.get("name").getAsString();

			// 如果在 feedback 找到 stage 的 json object 則跳出迴圈
			if (stageName.equals(feedbackName)) {
				isFound = true;
			}

			// 在 feedback array 中找不到 stage 的 feedback就新增一個
			if (index == feedbackArray.size() && isFound == false) {
				JsonObject newFeedbackObj = new JsonObject();
				newFeedbackObj.addProperty("name", stageName);
				newFeedbackObj.addProperty("description", "");
				newFeedbackArray.add(newFeedbackObj);
			}
			newFeedbackArray.add(feedback);
		}
		return newFeedbackArray;
	}

	// http://localhost:8080/ezScrum/taskBoard/ci/saveIssueHealthReport
	public void doSaveIssueHealthReport(StaplerRequest req, StaplerResponse rsp) {
		String svnCommittedLog = req.getParameter("svnCommittedLog");
		String projectID = req.getParameter("projectID");
		String userName = req.getParameter("userName");
		String password = req.getParameter("password");
		String buildResult = req.getParameter("buildResult");
		String ciBuildURL = req.getParameter("ciBuildURL");

		mEzScrumURL = req.getServerName() + ":" + req.getLocalPort() + req.getContextPath();
		//check null condition
		if (projectID == null || svnCommittedLog == null || buildResult == null || ciBuildURL == null || userName == null || password == null ||
		        projectID.isEmpty() || svnCommittedLog.isEmpty() || buildResult.isEmpty() || ciBuildURL.isEmpty() || userName.isEmpty() || password.isEmpty()) {
			try {
				rsp.getWriter().write("projectID, svnCommittedLog, buildResult, ciBuildURL, userName, password cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		// 取得當前 sprint id
		String sprintID = getCurrentSprint(projectID, userName, password);
		// 取得 stage list
		ArrayList<String> stageList = getWorkStages(projectID, sprintID);
		// parse svn log 取得 issue id
		String issueID = parseSVNLogGetIssueID(svnCommittedLog, stageList);

		if (issueID == null) {
			try {
				rsp.getWriter().write("issueID cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		// parse svn log 取得 feedback map
		Map<String, String> stageFeedbackMap = parseSVNLog(svnCommittedLog, stageList);

		IssueDAO issueDAO = new IssueDAO();
		String issueHealthReport = getIssueHealthReport(projectID, sprintID, issueID);

		// update issue health report
		String healthReport = buildNewHealthReport(issueHealthReport, buildResult, ciBuildURL, stageList, stageFeedbackMap);

		IssueInformation issue = new IssueInformation(projectID, sprintID, issueID, "", healthReport);
		issueDAO.updateIssueHealthReport(issue);

		try {
			rsp.getWriter().write("ezScrum server got svnCommittedLog");
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	// 呼叫 web service 取得 current sprint id
	private String getCurrentSprint(String projectID, String account, String password) {
		EzScrumWebServiceController ezScrumWebServiceController = new EzScrumWebServiceController(mEzScrumURL);
		String jsonString = ezScrumWebServiceController.getSprintInfoListString(projectID, account, password);
		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject) parser.parse(jsonString);

		String currentSprintID = o.get("currentSprintID").getAsString();
		return currentSprintID;
	}

	// 向 pluginConfigDAO 取得 current sprint id, 再取得 work stage 的資訊
	private ArrayList<String> getWorkStages(String projectID, String sprintID) {
		// get work stages
		PluginConfigDAO pluginConfigDAO = new PluginConfigDAO();
		String workStages = pluginConfigDAO.getWorkStages(projectID, sprintID);

		ArrayList<String> stages = parseWorkStages(workStages);

		return stages;
	}

	// 將 work stages 取出, 只抓第一層 stage 當 key word
	private ArrayList<String> parseWorkStages(String workStages) {
		ArrayList<String> stages = new ArrayList<String>();

		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject) parser.parse(workStages);
		JsonArray stageArray = o.getAsJsonArray("stages");

		for (JsonElement e : stageArray) {
			JsonObject stage = e.getAsJsonObject();
			String stageName = stage.get("name").getAsString();
			if (stageName.equals("Story") || stageName.equals("Not Checked Out") || stageName.equals("Done")) {
				continue;
			}
			stages.add(stageName + ":");
		}

		return stages;
	}

	// 以 stage name 來找出相關的 feedback
	private String parseSVNLogGetIssueID(String svnLog, ArrayList<String> stageList) {
		// 記錄所有 index, 以供後續 sort "依序"找出 stage 的 feedback
		ArrayList<Integer> indexList = new ArrayList<Integer>();

		int issueIDIndex = svnLog.indexOf("IssueID:");
		if (issueIDIndex >= 0) {
			indexList.add(issueIDIndex);
		} else {
			return null;
		}

		// 找出 svn log 中存在的 stage 及 index
		for (String stage : stageList) {
			int index = svnLog.indexOf(stage);
			if (index >= 0) {
				indexList.add(index);
			}
		}
		// 藉由 Collections 來 sort index
		Collections.sort(indexList);
		// 利用 index 來抓 IssueID
		int head = indexList.get(0);
		int tail = indexList.get(1);

		String issueIDKeyWord = "IssueID: ";// 使用者輸入資訊的規範, 例如 IssueID: 5465 (現階段非常陽春, 以後要擴展的話, 工具面可透過 sublipse來限制 )
		String issueID = svnLog.substring(head + issueIDKeyWord.length(), tail - 1);

		return issueID;
	}

	// 以 stage name 來找出相關的 feedback
	private Map<String, String> parseSVNLog(String svnLog, ArrayList<String> stageList) {
		// 最後要回傳的 map, key 為 stage, value 為 feedback
		Map<String, String> stageFeedbackMap = new HashMap<String, String>();
		// 記錄每個 stage 在log中的index
		Map<Integer, String> stageIndex = new HashMap<Integer, String>();
		// 記錄所有 index, 以供後續 sort "依序"找出 stage 的 feedback
		ArrayList<Integer> indexList = new ArrayList<Integer>();

		// 找出 svn log 中存在的 stage 及 index
		for (String stage : stageList) {
			int index = svnLog.indexOf(stage);
			if (index >= 0) {
				indexList.add(index);
				stageIndex.put(index, stage);
			}
		}
		// 藉由 Collections 來 sort index, 才能依序找出 feedback
		Collections.sort(indexList);
		// 利用 sort 過的 index, 逐一找出每個 stage 的 feedback
		stageFeedbackMap = setFeedBackMap(indexList, stageIndex, svnLog);

		return stageFeedbackMap;
	}

	// 利用 sort 過的 index, 逐一找出 svn log 中每個 stage 的 feedback
	private Map<String, String> setFeedBackMap(ArrayList<Integer> indexList,
	        Map<Integer, String> stageIndex, String svnLog) {
		// 最後要回傳的 map, key 為 stage, value 為 feedback
		Map<String, String> stageFeedbackMap = new HashMap<String, String>();

		for (int i = 0; i < indexList.size(); i++) {
			int indexHead = indexList.get(i); // 依照 index 範圍找出該 stage 的 feedback
			String stageName = stageIndex.get(indexHead); // 依照 index 找出該 stage 的 name
			int stageNameLength = stageName.length();// 取 feedback 時, 用以去掉 stage 名稱

			if (i != indexList.size() - 1) {
				int indexTail = indexList.get(i + 1);// 以下一個 stage 的 index 作為結尾
				// 取 feedback
				String stageFeedback = svnLog.substring(indexHead + stageNameLength, indexTail);
				// 將 name 及 feedback加入 map
				stageFeedbackMap.put(stageName, stageFeedback);
			} else {
				// 取 feedback
				String stageFeedback = svnLog.substring(indexHead + stageNameLength);
				// 將 name 及 feedback加入 map
				stageFeedbackMap.put(stageName, stageFeedback);
			}
		}
		return stageFeedbackMap;
	}

	private String buildNewHealthReport(String issueHealthReport, String buildResult, String ciBuildURL,
	        ArrayList<String> stageList, Map<String, String> stageFeedbackMap) {
		String newHealthReport = "";
		JsonObject newHealthReportObj = new JsonObject();
		JsonArray newHealthReportArray = new JsonArray();

		// 已經有存在任何資料
		if (issueHealthReport != null) {
			JsonParser parser = new JsonParser();
			JsonObject o = (JsonObject) parser.parse(issueHealthReport);
			JsonArray feedbackArray = o.getAsJsonArray("feedbacks");

			// update build result data
			newHealthReportArray = updateJsonFeedbackData("buildResult", buildResult, feedbackArray);
			// update build url data
			newHealthReportArray = updateJsonFeedbackData("ciBuildURL", ciBuildURL, newHealthReportArray);

			for (String s : stageList) {
				String desc = stageFeedbackMap.get(s);
				String name = s.substring(0, s.length() - 1); // 去掉前面加的冒號(:)

				newHealthReportArray = updateJsonFeedbackData(name, desc, newHealthReportArray);
			}

		}// 沒有存過任何feedback
		else {
			// 新增 obj buildResult
			JsonObject buildResultObj = new JsonObject();
			buildResultObj.addProperty("name", "buildResult");
			buildResultObj.addProperty("description", buildResult);
			newHealthReportArray.add(buildResultObj);

			// 新增 obj ciBuildURL
			JsonObject ciBuildURLObj = new JsonObject();
			ciBuildURLObj.addProperty("name", "ciBuildURL");
			ciBuildURLObj.addProperty("description", ciBuildURL);
			newHealthReportArray.add(ciBuildURLObj);

			// 新增所有 feedback 到 jsonArray中
			for (String s : stageList) {
				JsonObject newFeedback = new JsonObject();
				String name = s.substring(0, s.length() - 1); // 去掉前面加的冒號(:)
				String desc = stageFeedbackMap.get(name) == null ? "" : stageFeedbackMap.get(name);
				newFeedback.addProperty("name", name);
				newFeedback.addProperty("description", desc);

				newHealthReportArray.add(newFeedback);
			}
		}
		// 把 json array 包成 object
		newHealthReportObj.add("feedbacks", newHealthReportArray);
		newHealthReport = newHealthReportObj.toString();

		return newHealthReport;
	}

	// key, value
	private JsonArray updateJsonFeedbackData(String feedbackName, String feedbackDesc, JsonArray feedbackArray) {

		JsonArray newFeedbackArray = new JsonArray();

		int index = 0;
		// 尋找 JsonArray 中是否有此 feedback 的資料, 有的話把新的feedback object 取代之
		for (JsonElement e : feedbackArray) {
			index++;

			JsonObject feedback = e.getAsJsonObject();
			String name = feedback.get("name").getAsString();

			// 若已有舊的 feedback 資料, 則不加到新 array 中, 新的 feedback 內容等最後再加 
			if (name.equals(feedbackName)) {
				// do nothing
			} else {// 把沒相關的 feedback 加回去
				newFeedbackArray.add(feedback);
			}
		}

		// 最後feedback 都掃完了再把新的 feedback 加入
		JsonObject newFeedbackOnj = new JsonObject();
		newFeedbackOnj.addProperty("name", feedbackName);
		newFeedbackOnj.addProperty("description", feedbackDesc);
		newFeedbackArray.add(newFeedbackOnj);

		return newFeedbackArray;
	}
}
