import hudson.model.*
import hudson.util.*

// get job workspace
def build = Thread.currentThread().executable
def workspace = build.getWorkspace()

// get svn log
def ant = new AntBuilder()
ant.exec(executable: "svn", outputproperty:"output", dir:workspace){
	arg(line:"log -l 1")
}
def svnCommittedLog = ant.project.getProperty("output")

/*
Commit log 須遵照以下格式
1. 要附上 IssueID
2. key 要注意大小寫, 冒號後須空一格
IssueID: 5465
Design: http://123@123.cc.png
Develop: add 5 files, modified 4 files
Test: 20 tests passed
Review: reviewed by ninja
*/
 
if(manager.build.result != null){
	// jenkins job url: http://[IP]:[port]/job/[job name]/[build number]
	def ciBuildURL= "http://localhost:8080/job/testProject/"+manager.build.number

    // save svnCommitLog url
    def ezScrumRootURL = "http://140.124.181.110:8080/ezScrum"
    def addr       = "${ezScrumRootURL}/plugin/taskBoard/ci/saveIssueHealthReport"

    //auth info
    def userName = "admin"
    def password  =  "admin"
    def projectID   =  "test"

    //encode data utf-8
    userName =  URLEncoder.encode(userName,"UTF-8")
    password =  URLEncoder.encode(password,"UTF-8")
    projectID  =  URLEncoder.encode(projectID,"UTF-8")
    svnCommittedLog =  URLEncoder.encode(svnCommittedLog,"UTF-8")

  def data = "buildResult=${manager.build.result}&ciBuildURL=${ciBuildURL}&svnCommittedLog=${svnCommittedLog}&userName=${userName}&password=${password}&projectID=${projectID}"

    try{
        URI uri = new URI( addr )
        def conn = uri.toURL().openConnection()
        conn.setDoOutput(true);
 
        OutputStreamWriter wr = new OutputStreamWriter(conn.getOutputStream()); 
        wr.write(data) 
        wr.flush() 

        //we must let jenkins wait for response, or jenkins will finish this job and ezScrum server cannot take svn committed log info
        if( conn.responseCode != 200 ) {
            setWarning()
       }else{
           //if response is ok, check svn committedLog format info from ezScrum server
           BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));  
           String line ;  
           String result ="";  
           while( (line =br.readLine()) != null ){  
               result += "/n"+line;  
           }  
           br.close(); 
           //build.setDisplayName(  result )
       }

    }catch(java.net.ConnectException e){
              setWarning()
    }
   
   def setWarning = {
            manager.addWarningBadge("ezScrum server is broken, we cannot send svn committed log to ezScrum")
            manager.createSummary("warning.gif").appendText("<h1>ezScrum server is broken, we cannot send svn committed log to ezScrum</h1>", false, false, false, "red")
            manager.buildUnstable()
   }

}

