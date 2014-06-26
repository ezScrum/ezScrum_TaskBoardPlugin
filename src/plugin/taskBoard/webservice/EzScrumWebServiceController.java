package plugin.taskBoard.webservice;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

import javax.ws.rs.core.MediaType;

import org.codehaus.jettison.json.JSONObject;

import ch.ethz.ssh2.crypto.Base64;

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

public class EzScrumWebServiceController {
	private String mEzScrumURL;

	public EzScrumWebServiceController(String ezScrumURL) {
		mEzScrumURL = ezScrumURL;
	}

	public String getSprintInfoListString(String projectID, String account, String encodePassword) {
		// user information 加密
		String encodeProjectID = encodeUrl(projectID);
		String encodeUserName = new String(Base64.encode(account.getBytes()));

		String getSprintInfoWebServiceUrl = "http://" + mEzScrumURL +
		        "/web-service/" + encodeProjectID +
		        "/sprint-backlog/sprintlist?userName=" + encodeUserName +
		        "&password=" + encodePassword;

		System.out.println(getSprintInfoWebServiceUrl);
		Client client = Client.create();
		WebResource webResource = client.resource(getSprintInfoWebServiceUrl);

		Builder result = webResource.type(MediaType.APPLICATION_JSON)
		        .accept(MediaType.APPLICATION_JSON);

		return result.get(String.class);
	}

	public String getSprintBacklog(String projectID, String account, String encodePassword, String sprintID, String handlerID) {
		// user information 加密
		// user information 加密
		String encodeProjectID = encodeUrl(projectID);
		String encodeUserName = new String(Base64.encode(account.getBytes()));

		try {
			System.out.println(encodeUserName.toCharArray());
			Base64.decode(encodeUserName.toCharArray());
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		//http://IP:8080/ezScrum/web-service/{projectID}/sprint-backlog/{sprintID}/sprintbacklog?userName={userName}&password={password}
		String getTaskBoardStoryTaskWebServiceUrl = "http://" + mEzScrumURL +
		        "/web-service/" + encodeProjectID +
		        "/sprint-backlog/" + sprintID + "/" + handlerID +
		        "/sprintbacklog?userName=" + encodeUserName +
		        "&password=" + encodePassword;

		System.out.println(getTaskBoardStoryTaskWebServiceUrl);
		Client client = Client.create();
		WebResource webResource = client.resource(getTaskBoardStoryTaskWebServiceUrl);

		Builder result = webResource.type(MediaType.APPLICATION_JSON)
		        .accept(MediaType.APPLICATION_JSON);

		System.out.println("result.get(String.class);: " + result.get(String.class));

		return result.get(String.class);
	}

	private String encodeUrl(String url) {
		String result = "";
		try {
			result = URLEncoder.encode(url, "UTF-8");
			result = result.replace("+", "%20");// % 為特殊字元, encoder讀到會有問題, 所以等encoder完再把+轉成%20
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		return result;
	}
}
