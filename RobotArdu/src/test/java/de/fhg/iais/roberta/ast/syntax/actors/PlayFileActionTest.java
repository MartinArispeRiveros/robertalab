package de.fhg.iais.roberta.ast.syntax.actors;

import org.junit.Test;

import de.fhg.iais.roberta.testutil.Helper;

public class PlayFileActionTest {
    @Test
    public void playFile() throws Exception {
        String a = "";

        Helper.assertCodeIsOk(a, "/ast/actions/action_PlayFile.xml");
    }
}
