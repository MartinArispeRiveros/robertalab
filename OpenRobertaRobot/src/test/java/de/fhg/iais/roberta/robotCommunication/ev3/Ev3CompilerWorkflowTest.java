package de.fhg.iais.roberta.robotCommunication.ev3;

import org.junit.Test;

public class Ev3CompilerWorkflowTest {

    @Test
    public void test() throws Exception {
        new Ev3CompilerWorkflow(new Ev3Communicator(), null, null, null).runBuild("1Q2W3E4R", "blinker2", "generated.main");
    }
}
